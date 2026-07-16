import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { NodeError } from "@langchain/langgraph";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createProductionChatModel } from "#agent/llm/providers/index.js";
import {
  openRevisionItems,
  normalizeRevisionQuote,
  buildPreviewContent,
  getProfileFormat,
  previewHasContent,
  type WorkPreview,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import { getLatestHumanMessageId } from "#agent/messages/human.js";
import {
  getModelTemperature,
  getPreview,
  getProduction,
  getProfile,
  getReferences,
  getRevision,
  patchPendingPreview,
} from "#agent/state-io/index.js";
import { patchRunProgress } from "#agent/state-io/run-progress.js";
import {
  REVISE_TURN_SUBJECT,
  reviseTurnActivityId,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../../../helpers/recoverable-node-error.js";
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
      const anchor = normalizeRevisionQuote(item.anchor?.quote);
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
3. 输出 preview.content 字段（不要输出 kind；体裁由作品方案 format 决定）
4. 脚本类作品用 segments[] 分段；图文类保留 body / images
5. 正文避免互联网黑话与空泛套话（如「赋能」「抓手」「链路」「颗粒度」「闭环」等）
6. 不要输出解释 prose，只输出结构化 preview`;
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

请输出更新后的 preview（含 content  payload，不含 kind）。`;
}

function reviseActivityPatch(
  state: AgentStateType,
  status: "done" | "failed",
): AgentStatePatch {
  const humanMessageId = getLatestHumanMessageId(state.messages);
  if (!humanMessageId) return {};
  return upsertTurnActivity({
    id: reviseTurnActivityId(humanMessageId),
    refId: humanMessageId,
    kind: "revise_step",
    status,
    subject: REVISE_TURN_SUBJECT,
  });
}

function applyRevisionFailedPatch(
  state: AgentStateType,
  config?: RunnableConfig,
): AgentStatePatch {
  return {
    ...patchRunProgress("revise"),
    ...reviseActivityPatch(state, "failed"),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

function toWorkPreview(
  output: RevisePreviewOutput,
  state: AgentStateType,
): WorkPreview {
  const format = getProfileFormat(getProfile(state));
  const content = buildPreviewContent(format, {
    ...output.content,
    images: output.content.images?.map((image, index) => ({
      ...image,
      id: image.id ?? `image-${index}`,
    })),
    segments: output.content.segments?.map((segment, index) => ({
      ...segment,
      id: segment.id ?? `segment-${index}`,
    })),
  });
  return {
    title: output.title ?? null,
    hook: output.hook ?? null,
    hashtags: output.hashtags ?? [],
    notes: output.notes ?? null,
    content,
  };
}

export async function applyRevisionNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const preview = getPreview(state);
  if (!previewHasContent(preview)) {
    return patchRunProgress("revise");
  }

  const llm = createProductionChatModel({
    temperature: getModelTemperature(state),
    maxTokens: 8192,
  });

  const output = await invokeStructured(
    llm,
    RevisePreviewOutputSchema,
    [
      new SystemMessage(buildApplyRevisionSystemPrompt(state)),
      new HumanMessage(buildApplyRevisionHumanPrompt(state)),
    ],
    { name: "apply_revision" },
    config,
  );

  const nextPreview = toWorkPreview(output, state);
  if (!previewHasContent(nextPreview)) {
    return applyRevisionFailedPatch(state, config);
  }
  return {
    ...patchRunProgress("revise"),
    ...patchPendingPreview(state, nextPreview),
    ...reviseActivityPatch(state, "done"),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

export function applyRevisionErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  return applyRevisionFailedPatch(state);
}
