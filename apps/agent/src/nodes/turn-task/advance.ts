import {
  parseCompletedTurnTasks,
  parseTurnTaskQueue,
} from "../../lib/parse-agent-state.js";
import type { AgentStateType } from "../../state.js";

/** 完成当前任务后出队，并记入 completedTurnTasks。 */
export async function advanceTurnQueueNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const queue = parseTurnTaskQueue(state);
  const head = queue[0];
  if (!head) {
    return { activeTurnTask: null };
  }

  const completed = parseCompletedTurnTasks(state);
  return {
    turnTaskQueue: queue.slice(1),
    completedTurnTasks: [...completed, head],
    activeTurnTask: null,
  };
}
