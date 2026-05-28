/**
 * 创作模式工具：按大纲生成文案，执行完成后更新 outline.executed_changes。
 *
 * complete_execution 会把 pending 并入 executed；若全部落地则标记 outline_ready。
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createChatModel } from "../../llm/minimax.js";
import { env } from "../../env.js";
import {
  consumeStructuredOutputStream,
  invokeStructuredOutput,
  streamStructuredOutput,
} from "../../lib/structured-output.js";
import { type GeneratedContent } from "../../schemas.js";
import {
  GeneratedContentPayloadSchema,
  type GeneratedContentPayload,
} from "./schema.js";
import { parseMode, parseModelTemperature, parseOutline, parseProfile } from "./state.js";
import { addPendingChange } from "../../tools/pending-change.js";
import { switchMode } from "../../tools/mode.js";
import { updateWorkProfile } from "../../tools/profile.js";
import { REFERENCE_TOOLS } from "../../tools/references.js";
import { getState, toolCommand } from "../../tools/common.js";

function profileReady(profile: ReturnType<typeof parseProfile>) {
  return Boolean(profile.platform && profile.content_topic);
}

export const completeExecution = tool(
  async ({ summary }, config) => {
    if (parseMode(getState()) !== "creation") {
      return toolCommand(config, "complete_execution 仅在创作模式可用。");
    }
    const trimmed = summary.trim();
    if (!trimmed) return toolCommand(config, "执行摘要不能为空。");

    const outline = parseOutline(getState());
    if (!outline.pending_changes.length) {
      return toolCommand(config, "当前没有待执行变更，无需完成执行。");
    }

    const executedAt = new Date().toISOString();
    const executed = [
      ...outline.executed_changes,
      ...outline.pending_changes.map((change) => ({
        id: change.id,
        description: change.description,
        executed_at: executedAt,
        batch_summary: trimmed,
      })),
    ];
    const count = outline.pending_changes.length;
    /** pending 已全部并入 executed 时，视为大纲落地完成 */
    const allImplemented = executed.length > 0;

    return toolCommand(
      config,
      `执行完成，已合并 ${count} 条变更。摘要：${trimmed}${
        allImplemented ? "；大纲待实现项已全部完成。" : ""
      }`,
      {
        outline: {
          ...outline,
          pending_changes: [],
          executed_changes: executed,
          last_execution_summary: trimmed,
          outline_ready: allImplemented ? true : outline.outline_ready,
          outline_summary: allImplemented
            ? outline.outline_summary ?? trimmed
            : outline.outline_summary,
        },
      },
    );
  },
  {
    name: "complete_execution",
    description:
      "创作模式执行完成后调用：将待执行变更合并进已执行计划，清空待执行列表，记录执行摘要。",
    schema: z.object({
      summary: z.string().describe("本次执行的修改点摘要"),
    }),
  },
);

export const generateContent = tool(
  async (_input, config) => {
    const state = getState();
    if (parseMode(state) !== "creation") {
      return toolCommand(config, "文案生成仅在创作模式可用。");
    }
    const profile = parseProfile(state);
    const outline = parseOutline(state);
    if (!outline.pending_changes.length) {
      return toolCommand(
        config,
        "生成被阻止：请先 add_pending_change 记录待执行变更。",
      );
    }
    if (!profileReady(profile)) {
      return toolCommand(
        config,
        "生成被阻止：请先通过 update_work_profile 确认至少 platform 与 content_topic。",
      );
    }

    const llm = createChatModel({
      temperature: parseModelTemperature(state),
    });
    const refSummaries = (profile.references ?? [])
      .slice(0, 5)
      .map((r) => `- ${r.summary}`)
      .join("\n");
    const pending = outline.pending_changes
      .map((c) => `- ${c.description}`)
      .join("\n");

    const prompt = `为 ${profile.platform} 生成发布文案。

待执行变更（必须全部体现）：
${pending}

主题：${profile.content_topic}
类型：${profile.content_type ?? "未指定"}
要点：${profile.content_points?.join(", ") || "无"}
风格：${profile.style ?? "未指定"}；语气：${profile.tone ?? "未指定"}；人设：${profile.persona ?? "未指定"}
受众：${profile.audience ?? "未指定"}
目标：${profile.goals?.join(", ") || "无"}
约束：${profile.style_constraints?.join(", ") || "无"}
参考：${refSummaries || "无"}

请生成完整发布文案，包含 title、body、hashtags、hook、notes 字段。`;

    let payload: GeneratedContentPayload;
    try {
      const input = [
        new HumanMessage(
          `你是资深新媒体编辑，根据以下要求生成发布文案。\n\n${prompt}`,
        ),
      ];
      const structuredOptions = { name: "generated_content" } as const;

      if (env.llmStreaming) {
        payload = await consumeStructuredOutputStream(
          await streamStructuredOutput(
            llm,
            GeneratedContentPayloadSchema,
            input,
            structuredOptions,
          ),
        );
      } else {
        payload = await invokeStructuredOutput(
          llm,
          GeneratedContentPayloadSchema,
          input,
          structuredOptions,
        );
      }
    } catch {
      payload = {
        title: profile.content_topic,
        body: "文案生成失败，请重试。",
        hashtags: [],
      };
    }

    const creation: GeneratedContent = {
      platform: profile.platform ?? "unknown",
      title: payload.title ?? null,
      body: payload.body,
      hashtags: payload.hashtags ?? [],
      hook: payload.hook ?? null,
      notes: payload.notes ?? null,
      publish_ready: true,
    };

    return toolCommand(config, "文案已生成并写入 creation。", { creation });
  },
  {
    name: "generate_content",
    description: "创作模式下根据待执行变更与特征生成或更新文案，写入 creation。",
    schema: z.object({}),
  },
);

export const CREATION_TOOLS = [
  switchMode,
  addPendingChange,
  completeExecution,
  updateWorkProfile,
  generateContent,
  ...REFERENCE_TOOLS,
];
