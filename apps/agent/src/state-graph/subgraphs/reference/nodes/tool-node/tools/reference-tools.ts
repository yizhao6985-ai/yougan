/** 参考素材删除工具（方案子图通过 profile 调用，或 reference 子图自用） */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import { applyReferenceDeletes } from "@yougan/domain";
import {
  getReferences,
  getState,
  patchPendingReferences,
} from "#agent/state-io/index.js";

const referenceDeleteTargetSchema = z.object({
  reference_id: z.string().optional(),
  index: z.number().int().min(0).optional(),
  asset_url: z.string().optional(),
});

export const referenceApplyPatchSchema = z.object({
  delete: referenceDeleteTargetSchema.optional(),
  deletes: z.array(referenceDeleteTargetSchema).optional(),
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

export const referenceApplyPatch = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();
    const targets = collectDeleteTargets(input);

    if (!targets.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未提供可删除的参考素材。",
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

    const result = applyReferenceDeletes(references, targets);
    const parts: string[] = [];
    if (result.deleted > 0) {
      parts.push(
        `已删除 ${result.deleted} 条参考素材（剩余 ${result.references.length} 条）。`,
      );
    } else {
      parts.push("未删除任何参考素材。");
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
      "删除参考素材。按 reference_id、index（从 0 起）或 asset_url 指定要删的条目。",
    schema: referenceApplyPatchSchema,
  },
);
