import {
  parseCompletedTurnKinds,
  parseTurnQueue,
} from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";

/** 完成当前队列项后出队，并记入 completedTurnKinds */
export async function advanceTurnQueueNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const queue = parseTurnQueue(state);
  const head = queue[0];
  if (!head) {
    return { activeTurnKind: null };
  }

  const completed = parseCompletedTurnKinds(state);
  return {
    turnQueue: queue.slice(1),
    completedTurnKinds: [...completed, head],
    activeTurnKind: null,
  };
}
