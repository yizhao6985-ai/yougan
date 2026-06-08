/** 参考素材 patch 工具：删除条目、更新使用意图 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import { applyReferencePatch } from "@yougan/domain";
import {
  getReferences,
  getState,
  patchPendingReferences,
} from "#agent/state-io/index.js";

const referenceTargetSchema = z.object({
  reference_id: z.string().optional(),
  index: z.number().int().min(0).optional(),
  asset_url: z.string().optional(),
});

const referenceIntentUpdateSchema = referenceTargetSchema.extend({
  intent: z.object({
    summary: z
      .string()
      .min(1)
      .describe("用户希望如何借鉴该参考；用归纳表述，不要复述用户原话"),
  }),
});

export const referenceApplyPatchSchema = z.object({
  delete: referenceTargetSchema.optional(),
  deletes: z.array(referenceTargetSchema).optional(),
  update: referenceIntentUpdateSchema.optional(),
  updates: z.array(referenceIntentUpdateSchema).optional(),
});

function collectDeleteTargets(
  input: z.infer<typeof referenceApplyPatchSchema>,
): Array<{ reference_id?: string; index?: number; asset_url?: string }> {
  const targets: Array<{
    reference_id?: string;
    index?: number;
    asset_url?: string;
  }> = [];
  if (input.delete) targets.push(input.delete);
  if (input.deletes?.length) targets.push(...input.deletes);
  return targets;
}

function collectIntentUpdates(
  input: z.infer<typeof referenceApplyPatchSchema>,
): Array<{
  reference_id?: string;
  index?: number;
  asset_url?: string;
  intent: { summary: string };
}> {
  const updates: Array<{
    reference_id?: string;
    index?: number;
    asset_url?: string;
    intent: { summary: string };
  }> = [];
  if (input.update) updates.push(input.update);
  if (input.updates?.length) updates.push(...input.updates);
  return updates;
}

export const referenceApplyPatch = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();
    const deletes = collectDeleteTargets(input);
    const updates = collectIntentUpdates(input);

    if (!deletes.length && !updates.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未提供可执行的参考素材变更（delete / update）。",
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

    const result = applyReferencePatch(references, { deletes, updates });
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
    if (result.warnings.length) {
      parts.push(`注意：${result.warnings.join("；")}`);
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
      "patch 参考素材：delete/deletes 删除条目；update/updates 修改使用意图 intent.summary。按 reference_id、index（从 0 起）或 asset_url 定位条目。",
    schema: referenceApplyPatchSchema,
  },
);
