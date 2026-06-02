import { resolveTurnTaskQueue } from "./resolve-turn-queue.js";
import type { AgentStateType } from "../../state.js";

/** 结构化解析本轮任务队列。 */
export async function resolveTurnQueueNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const turnTaskQueue = await resolveTurnTaskQueue(state);
  return {
    turnTaskQueue,
    completedTurnTasks: [],
    activeTurnTask: null,
  };
}
