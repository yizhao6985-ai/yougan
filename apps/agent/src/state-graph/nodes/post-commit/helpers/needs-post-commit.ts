import type { AgentStateType } from "#agent/state.js";

import { needsConversationTitle } from "./generate-conversation-title.js";

/** commitTurn 后是否需进入 postCommit 系统收尾 */
export function needsPostCommitProcessing(state: AgentStateType): boolean {
  if (state.turn.cancelled) return false;
  return needsConversationTitle(state);
}
