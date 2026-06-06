import { getTurnQueue } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** 标记当前正在执行的队列项 */
export async function dispatchTurnQueueNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const head = getTurnQueue(state)[0];
  if (!head) {
    return { activeTurnKind: null };
  }
  return { activeTurnKind: head };
}
