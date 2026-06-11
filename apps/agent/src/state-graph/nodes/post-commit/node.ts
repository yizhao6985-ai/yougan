/** commitTurn 后系统级收尾：对话标题等不入 turn 队列的后台处理 */
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { resolveConversationTitle } from "./helpers/generate-conversation-title.js";

export async function postCommitNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  if (state.turn.cancelled) {
    return {};
  }

  const generatedConversationTitle = await resolveConversationTitle(state);
  return { generatedConversationTitle };
}
