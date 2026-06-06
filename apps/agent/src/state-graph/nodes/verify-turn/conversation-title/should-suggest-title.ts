import { isDefaultConversationTitle } from "@yougan/domain";

import { getHumanMessageContents } from "#agent/messages/human.js";
import type { AgentStateType } from "#agent/state.js";

/** 首条用户消息且对话仍为占位标题时，可自动生成标题 */
export function shouldSuggestConversationTitle(
  state: AgentStateType,
): boolean {
  const title = state.conversationTitle?.trim() ?? "";
  if (!isDefaultConversationTitle(title)) return false;
  return getHumanMessageContents(state.messages).length === 1;
}
