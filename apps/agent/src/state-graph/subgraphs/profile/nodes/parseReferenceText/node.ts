/** work node：解析参考文案写入 references */
import { HumanMessage } from "@langchain/core/messages";

import { createChatModel } from "#agent/model/dashscope.js";
import { appendProfileReferences, truncateMessageContent } from "@yougan/domain";
import type { ReferenceItem } from "@yougan/domain";
import {
  patchStagingProfile,
  patchStagingProfileMeta,
} from "#agent/runtime/staging-writes.js";
import { parseProfile } from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

import { buildParseReferenceTextPrompt } from "./prompt.js";

export async function parseReferenceTextNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const text = state.staging?.meta.profile?.pendingParseReferenceText?.trim();
  if (!text) return {};

  const llm = createChatModel({ temperature: 0.2 });
  const response = await llm.invoke([
    new HumanMessage(buildParseReferenceTextPrompt(text)),
  ]);
  const summary = truncateMessageContent(response.content);
  const item: ReferenceItem = {
    source_type: "text",
    summary,
    keywords: [],
    raw_excerpt: text.slice(0, 1000),
  };

  const profile = appendProfileReferences(parseProfile(state), [item]);
  return {
    ...patchStagingProfile(state, profile),
    ...patchStagingProfileMeta(state, { pendingParseReferenceText: null }),
  };
}
