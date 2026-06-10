/** 参考素材 patch 工具：删除条目、更新使用意图（intent 由 summarizeIntent 统一归纳） */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import {
  applyReferencePatch,
  findReferenceIndex,
} from "./helpers/reference-patch.js";
import {
  getReferences,
  getState,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import {
  summarizeReferenceIntent,
  toReferenceIntent,
} from "../../ingest-references/helpers/summarize-intent.js";

const referenceTargetSchema = z.object({
  reference_id: z.string().optional().describe("参考素材 id"),
  index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("在参考列表中的序号，从 0 起"),
  asset_url: z.string().optional().describe("素材 URL，与 id/index 三选一"),
});

const referenceIntentUpdateSchema = referenceTargetSchema.extend({
  user_context: z
    .string()
    .optional()
    .describe("感友关于如何借鉴的原话；由系统归纳 intent.summary"),
  intent: z
    .object({
      summary: z.string().min(1),
    })
    .optional()
    .describe("已归纳好的意图摘要；通常留空，传 user_context 即可"),
});

export const referenceApplyPatchSchema = z.object({
  deletes: z
    .array(referenceTargetSchema)
    .optional()
    .describe("删除参考素材"),
  updates: z
    .array(referenceIntentUpdateSchema)
    .optional()
    .describe("更新参考素材使用意图"),
});

type ReferencePatchInput = z.infer<typeof referenceApplyPatchSchema>;

type ResolvedIntentUpdate = {
  reference_id?: string;
  index?: number;
  asset_url?: string;
  intent: { summary: string };
};

async function resolveIntentUpdates(
  references: ReturnType<typeof getReferences>,
  updates: NonNullable<ReferencePatchInput["updates"]>,
): Promise<{ resolved: ResolvedIntentUpdate[]; warnings: string[] }> {
  const resolved: ResolvedIntentUpdate[] = [];
  const warnings: string[] = [];

  for (const item of updates) {
    const target = {
      reference_id: item.reference_id,
      index: item.index,
      asset_url: item.asset_url,
    };
    const hasTarget =
      target.index != null ||
      Boolean(target.reference_id?.trim()) ||
      Boolean(target.asset_url?.trim());

    if (!hasTarget) {
      warnings.push("更新项须提供 reference_id、index 或 asset_url");
      continue;
    }

    const presetSummary = item.intent?.summary?.trim();
    if (presetSummary) {
      resolved.push({
        ...target,
        intent: { summary: presetSummary },
      });
      continue;
    }

    const userContext = item.user_context?.trim();
    if (!userContext) {
      warnings.push("更新项须提供 user_context 或 intent.summary");
      continue;
    }

    const refIndex = findReferenceIndex(references, target);
    if (refIndex < 0) {
      warnings.push(
        `未找到参考素材 ${target.reference_id ?? target.asset_url ?? String(target.index ?? "")}`.trim(),
      );
      continue;
    }

    const reference = references[refIndex]!;
    const intentResult = await summarizeReferenceIntent({
      analysis: reference.analysis,
      user_context: userContext,
    });
    resolved.push({
      ...target,
      intent: toReferenceIntent(intentResult),
    });
  }

  return { resolved, warnings };
}

export const referenceApplyPatch = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();
    const deletes = input.deletes ?? [];
    const updates = input.updates ?? [];

    if (!deletes.length && !updates.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未提供可执行的参考素材变更（deletes / updates）。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const references = getReferences(state);
    if (!references.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "当前尚无参考素材。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const { resolved, warnings: resolveWarnings } = await resolveIntentUpdates(
      references,
      updates,
    );

    const result = applyReferencePatch(references, {
      deletes,
      updates: resolved,
    });
    const parts: string[] = [];
    if (result.deleted > 0) {
      parts.push(
        `已删除 ${result.deleted} 条参考素材（剩余 ${result.references.length} 条）。`,
      );
    }
    if (result.updated > 0) {
      parts.push(`已更新 ${result.updated} 条参考素材的使用意图。`);
    }
    if (!result.deleted && !result.updated) {
      parts.push("未变更任何参考素材。");
    }

    const allWarnings = [...resolveWarnings, ...result.warnings];
    if (allWarnings.length) {
      parts.push(`注意：${allWarnings.join("；")}`);
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: parts.join(" "),
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingReferences(state, result.references),
      },
    });
  },
  {
    name: "reference_apply_patch",
    description:
      "变更参考素材：deletes 删除条目；updates 改使用意图（传 user_context，系统归纳 summary）。新增分析由 ingest 完成，勿重复调用。",
    schema: referenceApplyPatchSchema,
  },
);
