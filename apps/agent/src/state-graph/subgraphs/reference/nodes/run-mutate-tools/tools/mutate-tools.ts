/** 参考素材删改的原子工具 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import { getLatestHumanMessageAttachments } from "#agent/messages/human.js";
import {
  getReferences,
  getState,
  patchPendingReferences,
} from "#agent/state-io/index.js";

import {
  attachPendingReferencesContext,
  attachReferenceUserContext,
} from "../../mutate-references/helpers/attach-user-context.js";
import { applyReferencePatch } from "../../mutate-references/helpers/reference-patch.js";

const referenceTargetFields = z.object({
  reference_id: z
    .string()
    .optional()
    .describe("参考 id，从列表原样复制"),
  index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("参考在列表中的下标（0 起）"),
  asset_url: z.string().optional().describe("参考资源 URL"),
});

function hasReferenceTarget(
  value: z.infer<typeof referenceTargetFields>,
): boolean {
  return Boolean(
    value.reference_id?.trim() ||
      value.asset_url?.trim() ||
      value.index != null,
  );
}

const referenceTargetSchema = referenceTargetFields.refine(hasReferenceTarget, {
  message: "须提供 reference_id、index 或 asset_url 之一",
});

const updateReferenceIntentSchema = referenceTargetFields
  .extend({
    user_context: z
      .string()
      .min(1)
      .describe("感友关于如何借鉴该条参考的原话或要点"),
  })
  .refine(hasReferenceTarget, {
    message: "须提供 reference_id、index 或 asset_url 之一",
  });

export const deleteReference = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();
    const references = getReferences(state);
    const result = applyReferencePatch(references, {
      deletes: [input],
    });

    const message =
      result.deleted > 0
        ? `已删除 ${result.deleted} 条参考素材。`
        : result.warnings[0] ?? "未删除任何参考素材。";

    if (result.warnings.length && result.deleted > 0) {
      console.warn("[deleteReference]", result.warnings.join("；"));
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({ content: message, tool_call_id: toolCallId }),
        ],
        ...patchPendingReferences(state, result.references),
      },
    });
  },
  {
    name: "delete_reference",
    description: "删除一条参考素材。",
    schema: referenceTargetSchema,
  },
);

export const updateReferenceIntent = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();
    const references = getReferences(state);
    const { user_context, ...target } = input;
    const result = attachReferenceUserContext(
      references,
      target,
      user_context,
    );

    const message = result.warning
      ? result.warning
      : "已记录该条参考的借鉴说明。";

    return new Command({
      update: {
        messages: [
          new ToolMessage({ content: message, tool_call_id: toolCallId }),
        ],
        ...patchPendingReferences(state, result.references),
      },
    });
  },
  {
    name: "update_reference_intent",
    description: "为指定参考写入感友关于如何借鉴的说明（user_context）。",
    schema: updateReferenceIntentSchema,
  },
);

export const setPendingReferencesContext = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();
    const references = getReferences(state);
    const attachmentUrls = new Set(
      getLatestHumanMessageAttachments(state.messages)
        .map((a) => a.url.trim())
        .filter(Boolean),
    );
    const next = attachPendingReferencesContext(
      references,
      input.user_context,
      attachmentUrls,
    );

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已为待确认参考写入统一借鉴说明。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingReferences(state, next),
      },
    });
  },
  {
    name: "set_pending_references_context",
    description:
      "为所有 pending 参考及本轮新上传参考写入统一的借鉴说明（未指定具体条目时使用）。",
    schema: z.object({
      user_context: z
        .string()
        .min(1)
        .describe("感友关于如何借鉴参考的原话或要点"),
    }),
  },
);
