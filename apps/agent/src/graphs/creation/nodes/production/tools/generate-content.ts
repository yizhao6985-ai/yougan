import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createChatModel } from "../../../../../llm/dashscope.js";
import { env } from "../../../../../env.js";
import {
  resolveContentSpec,
  type ContentFormatId,
  type MediaModalityId,
} from "../../../../../lib/content-spec.js";
import {
  consumeStructuredOutputStream,
  invokeStructuredOutput,
  streamStructuredOutput,
} from "../../../../../lib/structured-output.js";
import {
  getPlanSummary,
  isPlanReady,
  type GeneratedContent,
} from "../../../../../schema.js";
import { buildFormatGenerationGuidance } from "../prompt-format.js";
import {
  GeneratedContentPayloadSchema,
  type GeneratedContentPayload,
} from "../schema.js";
import {
  parseMode,
  parseModelTemperature,
  parseProductionPlan,
  parseProfile,
} from "../../../../../lib/parse-agent-state.js";
import { getState } from "../../../../../lib/tool-state.js";
import { toolCommand } from "../../../../../lib/tool-command.js";

import { profileReady } from "./shared.js";

export const generateContent = tool(
  async (_input, config) => {
    const state = getState();
    if (parseMode(state) !== "creation") {
      return toolCommand(config, "文案生成仅在创作模式可用。");
    }
    const profile = resolveContentSpec(parseProfile(state));
    const plan = parseProductionPlan(state);
    if (!plan.pending_changes.length) {
      return toolCommand(
        config,
        "生成被阻止：请先 add_pending_change 记录待执行任务。",
      );
    }
    if (!isPlanReady(plan)) {
      return toolCommand(config, "生成被阻止：制作计划尚未定稿。");
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
    const pending = plan.pending_changes
      .map((c) => `- ${c.description}`)
      .join("\n");
    const industry = plan.industry_context ?? "";

    const formatGuidance = buildFormatGenerationGuidance(
      profile.content_format as ContentFormatId | null,
      profile.media_modality as MediaModalityId | null,
    );

    const prompt = `为 ${profile.platform} 生成发布文案（文案总监执行）。

制作计划摘要：${getPlanSummary(plan) ?? "无"}

待执行任务（必须全部体现）：
${pending}

主题：${profile.content_topic}
体裁：${profile.content_format ?? "未指定"}
媒介形式：${profile.media_modality ?? "未指定"}
要点：${profile.content_points?.join(", ") || "无"}
风格：${profile.style ?? "未指定"}；语气：${profile.tone ?? "未指定"}
受众：${profile.audience ?? "未指定"}
行业背景：${industry || "无"}
参考：${refSummaries || "无"}

写作要求：
${formatGuidance}

请生成完整发布文案，包含 title、body、hashtags、hook、notes 字段。`;

    let payload: GeneratedContentPayload;
    try {
      const input = [
        new HumanMessage(
          `你是资深文案总监，根据制作计划生成发布文案。\n\n${prompt}`,
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

    return toolCommand(config, "文案总监已完成文案，写入 creation。", { creation });
  },
  {
    name: "generate_content",
    description: "文案总监根据待执行任务与制作计划生成或更新文案，写入 creation。",
    schema: z.object({}),
  },
);
