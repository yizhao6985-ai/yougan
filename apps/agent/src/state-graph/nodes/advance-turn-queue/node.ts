import {
  getCompletedTurnKinds,
  getTurnQueue,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** 完成当前队列项后出队，并记入 completedTurnKinds */
export async function advanceTurnQueueNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const queue = getTurnQueue(state);
  const head = queue[0];
  if (!head) {
    return { activeTurnKind: null };
  }

  const completed = getCompletedTurnKinds(state);
  return {
    turnQueue: queue.slice(1),
    completedTurnKinds: [...completed, head],
    activeTurnKind: null,
  };
}
