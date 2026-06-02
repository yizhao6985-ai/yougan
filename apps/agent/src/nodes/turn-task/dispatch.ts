import { parseTurnTaskQueue } from "../../lib/parse-agent-state.js";
import type { AgentStateType } from "../../state.js";

/** 标记当前正在执行队列首项。 */
export async function dispatchTurnTaskNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const head = parseTurnTaskQueue(state)[0];
  if (!head) {
    return { activeTurnTask: null };
  }
  return { activeTurnTask: head, briefSuggestions: null };
}
