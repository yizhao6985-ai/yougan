import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createChatModel } from "#agent/llm/dashscope.js"
import { env } from "#agent/env.js"
import {
  type ContentFormatId,
  type MediaModalityId,
} from "#agent/lib/content-spec.js";
import {
  consumeStructuredOutputStream,
  invokeStructuredOutput,
  streamStructuredOutput,
} from "#agent/lib/structured-output.js";
import {
  getBlueprintPremise,
  getPlanSummary,
  hasOutlineContent,
  isBlueprintActionable,
  isPlanReady,
  type WorkDraft,
} from "@yougan/domain";
import { blueprintToContentProfile } from "#agent/lib/blueprint/content-profile.js";
import { blueprintSummary } from "#agent/prompt/context.js";
import { buildFormatGenerationGuidance } from "../../llm-call/prompt-format.js";
import {
  WorkDraftPayloadSchema,
  type WorkDraftPayload,
} from "./schema.js";
import {
  parseActiveTurnKind,
  parseBlueprint,
  parseModelTemperature,
  parseProductionPlan,
  parseProfile,
} from "#agent/lib/parse-agent-state.js";
import { getState } from "#agent/lib/tool-state.js"
import { toolCommand } from "#agent/lib/tool-command.js"

export const generateDraft = tool(
  async (_input, config) => {
    const state = getState();
    if (parseActiveTurnKind(state) !== "creation") {
      return toolCommand(config, "generate_draft 仅在创作模式可用。");
    }
    const profile = parseProfile(state);
    const blueprint = parseBlueprint(state);
    const contentProfile = blueprintToContentProfile(blueprint);
    const plan = parseProductionPlan(state);

    if (!hasOutlineContent(blueprint)) {
      return toolCommand(config, "生成被阻止：尚无作品方案节拍。");
    }
    if (!plan.pending_tasks.length) {
      return toolCommand(
        config,
        "生成被阻止：内部创作计划尚无待执行任务。",
      );
    }
    if (!isPlanReady(plan)) {
      return toolCommand(config, "生成被阻止：创作计划尚未就绪。");
    }
    if (!isBlueprintActionable(blueprint)) {
      return toolCommand(
        config,
        "生成被阻止：请先在作品方案中确认创作主题与内容节拍。",
      );
    }

    const llm = createChatModel({
      temperature: parseModelTemperature(state),
    });
    const refSummaries = (profile.references ?? [])
      .slice(0, 5)
      .map((r) => `- ${r.summary}`)
      .join("\n");
    const pending = plan.pending_tasks.map((c) => `- ${c.description}`).join("\n");
    const industry = plan.industry_context ?? "";

    const formatGuidance = buildFormatGenerationGuidance(
      contentProfile.content_format as ContentFormatId | null,
      contentProfile.media_modality as MediaModalityId | null,
    );

    const prompt = `生成创作成稿（文案总监执行）。

作品方案：${getBlueprintPremise(blueprint) ?? blueprintSummary(blueprint)}
创作计划摘要：${getPlanSummary(plan) ?? "无"}

待执行任务（必须全部体现）：
${pending}

主题：${contentProfile.content_topic}
体裁：${contentProfile.content_format ?? "未指定"}
媒介形式：${contentProfile.media_modality ?? "未指定"}
风格：${contentProfile.style ?? "未指定"}；语气：${contentProfile.tone ?? "未指定"}
受众：${contentProfile.audience ?? "未指定"}
行业背景：${industry || "无"}
参考：${refSummaries || "无"}

写作要求：
${formatGuidance}

请生成完整成稿，包含 title、body、hashtags、hook、notes 字段。`;

    let payload: WorkDraftPayload;
    try {
      const input = [
        new HumanMessage(
          `你是资深文案总监，根据创作计划生成发布文案。\n\n${prompt}`,
        ),
      ];
      const structuredOptions = { name: "work_draft" } as const;

      if (env.llmStreaming) {
        payload = await consumeStructuredOutputStream(
          await streamStructuredOutput(
            llm,
            WorkDraftPayloadSchema,
            input,
            structuredOptions,
          ),
        );
      } else {
        payload = await invokeStructuredOutput(
          llm,
          WorkDraftPayloadSchema,
          input,
          structuredOptions,
        );
      }
    } catch {
      payload = {
        title: contentProfile.content_topic,
        body: "文案生成失败，请重试。",
        hashtags: [],
      };
    }

    const draft: WorkDraft = {
      platform: contentProfile.platform ?? "yougan",
      title: payload.title ?? null,
      body: payload.body,
      hashtags: payload.hashtags ?? [],
      hook: payload.hook ?? null,
      notes: payload.notes ?? null,
      publish_ready: true,
    };

    return toolCommand(config, "文案总监已完成成稿，写入 draft。", { draft });
  },
  {
    name: "generate_draft",
    description: "文案总监根据内部创作计划生成或更新成稿。",
    schema: z.object({}),
  },
);
