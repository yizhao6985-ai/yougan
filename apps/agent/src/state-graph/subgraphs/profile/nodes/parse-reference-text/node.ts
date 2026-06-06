/** work node：解析参考文案写入 references */
import { HumanMessage } from "@langchain/core/messages";

import { createChatModel } from "#agent/model/dashscope.js";
import { appendProfileReferences, truncateMessageContent } from "@yougan/domain";
import type { ReferenceItem } from "@yougan/domain";
import {
  patchPendingProfile,
  patchPendingProfileMeta,
} from "#agent/state-io/index.js";
import { getProfile, getProfileStagingMeta } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildParseReferenceTextPrompt } from "./prompt.js";

export async function parseReferenceTextNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const text = getProfileStagingMeta(state).pendingParseReferenceText?.trim();
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

  const profile = appendProfileReferences(getProfile(state), [item]);
  return {
    ...patchPendingProfile(state, profile),
    ...patchPendingProfileMeta(state, { pendingParseReferenceText: null }),
  };
}
