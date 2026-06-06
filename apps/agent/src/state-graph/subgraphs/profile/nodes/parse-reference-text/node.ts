/** work node：解析参考文案写入 references */
import { HumanMessage } from "@langchain/core/messages";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { appendProfileReferences } from "@yougan/domain";
import type { ReferenceItem } from "@yougan/domain";
import {
  patchPendingProfile,
  patchPendingProfileMeta,
} from "#agent/state-io/index.js";
import { getProfile, getProfileStagingMeta } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildParseReferenceTextPrompt } from "./prompt.js";
import { ReferenceTextParseSchema } from "./schema.js";

export async function parseReferenceTextNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const text = getProfileStagingMeta(state).pendingParseReferenceText?.trim();
  if (!text) return {};

  const llm = createChatModel({ temperature: 0.2 });
  const parsed = await invokeStructured(
    llm,
    ReferenceTextParseSchema,
    [new HumanMessage(buildParseReferenceTextPrompt(text))],
    { name: "parse_reference_text" },
  );

  const item: ReferenceItem = {
    source_type: "text",
    summary: parsed.summary,
    keywords: parsed.keywords,
    tone_hints: parsed.tone_hints,
    structure_hints: parsed.structure_hints,
    raw_excerpt: text.slice(0, 1000),
  };

  const profile = appendProfileReferences(getProfile(state), [item]);
  return {
    ...patchPendingProfile(state, profile),
    ...patchPendingProfileMeta(state, { pendingParseReferenceText: null }),
  };
}
