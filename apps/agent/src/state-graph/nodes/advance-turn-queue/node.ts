import {
  getCompletedTurnKinds,
  getTurnQueue,
  patchTurn,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/** 完成当前队列项后出队，并记入 completedKinds */
export async function advanceTurnQueueNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const queue = getTurnQueue(state);
  const head = queue[0];
  if (!head) {
    return patchTurn(state, { activeKind: null });
  }

  const completed = getCompletedTurnKinds(state);
  return patchTurn(state, {
    queue: queue.slice(1),
    completedKinds: [...completed, head],
    activeKind: null,
  });
}
