import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createProductionChatModel } from "#agent/llm/providers/index.js";
import {
  openRevisionItems,
  previewPlainText,
  type WorkPreview,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import {
  getModelTemperature,
  getPreview,
  getProduction,
  getProfile,
  getReferences,
  getRevision,
  patchPendingPreview,
} from "#agent/state-io/index.js";
import {
  buildRunProgress,
  patchRunProgress,
  withRunProgressHeartbeat,
} from "#agent/state-io/run-progress.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import {
  RevisePreviewOutputSchema,
  type RevisePreviewOutput,
} from "./schema.js";

function buildRevisionItemsBlock(
  state: AgentStateType,
): string {
  const items = openRevisionItems(getRevision(state));
  if (!items.length) return "（无清单项，按用户最新消息改稿）";
  return items
    .map((item, index) => {
      const anchor = item.anchor?.quote?.trim();
      return `${index + 1}. ${anchor ? `「${anchor}」→ ` : ""}${item.instruction}`;
    })
    .join("\n");
}

function buildApplyRevisionSystemPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  return `你是改稿执行编辑（内部角色，不对${YOUGAN_USER_LABEL}直接说话）。
根据「当前成稿 + 改稿清单 + 作品方案 + 制作计划」产出**更新后的完整作品 preview**。

规则：
1. 必须落实改稿清单中的每一条意见
2. 未在清单中要求修改的部分，尽量保持原文（允许为连贯性做最小衔接调整）
3. 输出完整 blocks 数组；保留原有 block id（可合并/拆分 text block，但 image block 的 url 除非清单要求更换否则保留）
4. 不要输出解释 prose，只输出结构化 preview`;
}

function buildApplyRevisionHumanPrompt(state: AgentStateType): string {
  const preview = getPreview(state);
  const production = getProduction(state);
  const profile = getProfile(state);
  const references = getReferences(state);

  const baselineJson = preview ? JSON.stringify(preview, null, 2) : "（无）";
  const planSummary =
    production.pending_tasks
      ?.map((t) => `- ${t.description}${t.direction ? `：${t.direction}` : ""}`)
      .join("\n") || "（无）";

  return `## 作品方案
${profileSummary(profile, references)}

## 制作计划摘要
${planSummary}

## 改稿清单
${buildRevisionItemsBlock(state)}

## 当前成稿（JSON）
${baselineJson}

请输出更新后的完整 preview（含 blocks）。`;
}

function toWorkPreview(output: RevisePreviewOutput): WorkPreview {
  return {
    title: output.title ?? null,
    hook: output.hook ?? null,
    hashtags: output.hashtags ?? [],
    notes: output.notes ?? null,
    blocks: output.blocks.map((block) => {
      if (block.type === "image") {
        return {
          id: block.id,
          type: "image" as const,
          url: block.url,
          alt: block.alt ?? null,
          prompt: block.prompt ?? null,
          taskId: block.taskId ?? null,
        };
      }
      return {
        id: block.id,
        type: "text" as const,
        markdown: block.markdown,
        taskId: block.taskId ?? null,
      };
    }),
  };
}

export async function applyRevisionNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const preview = getPreview(state);
  if (!preview?.blocks?.length) {
    return {};
  }

  const progress = buildRunProgress("revise_apply", "正在按清单改稿…");

  const llm = createProductionChatModel({
    temperature: getModelTemperature(state),
    maxTokens: 8192,
  });

  let output: RevisePreviewOutput;
  try {
    output = await withRunProgressHeartbeat(progress, config, () =>
      invokeStructured(
        llm,
        RevisePreviewOutputSchema,
        [
          new SystemMessage(buildApplyRevisionSystemPrompt(state)),
          new HumanMessage(buildApplyRevisionHumanPrompt(state)),
        ],
        { name: "apply_revision" },
        config,
      ),
    );
  } catch {
    return { ...patchRunProgress(progress) };
  }

  const nextPreview = toWorkPreview(output);
  return {
    ...patchPendingPreview(state, nextPreview),
    ...patchRunProgress(progress),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
