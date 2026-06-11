import { getTurnQueue, patchTurn } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/** 标记当前正在执行的队列项 */
export async function dispatchTurnQueueNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const head = getTurnQueue(state)[0];
  return patchTurn(state, { activeKind: head ?? null });
}
