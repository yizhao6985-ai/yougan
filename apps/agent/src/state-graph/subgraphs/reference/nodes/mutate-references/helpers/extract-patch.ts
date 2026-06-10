import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { WorkReference } from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";

import { buildExtractPatchPrompt } from "./extract-patch-prompt.js";
import { ReferencePatchSchema, type ReferencePatch } from "./extract-patch-schema.js";

export async function extractReferencePatch(
  input: { references: WorkReference[]; user_message: string },
  config?: RunnableConfig,
): Promise<ReferencePatch> {
  const llm = createChatModel({ temperature: 0.1 });
  const parsed = await invokeStructured(
    llm,
    ReferencePatchSchema,
    [
      new HumanMessage(
        buildExtractPatchPrompt({
          references: input.references,
          user_message: input.user_message,
        }),
      ),
    ],
    { name: "reference_extract_patch" },
    config,
  );
  return {
    deletes: parsed.deletes ?? [],
    intent_updates: parsed.intent_updates ?? [],
    global_user_context: parsed.global_user_context,
  };
}
