import {
  getCompletedTurnKinds,
  getTurnQueue,
  patchTurn,
} from "#agent/state-io/index.js";
import { patchRunProgress } from "#agent/state-io/run-progress.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/** 主回合已空且并行建议尚未写入时，展示「正在生成建议…」 */
function directionsProgressIfWaiting(
  state: AgentStateType,
): AgentStatePatch {
  if (state.turn.cancelled) return {};
  if (state.pendingTurnDirections != null) return {};
  return patchRunProgress("turn_briefing");
}

/** 完成当前队列项后出队，并记入 completedKinds */
export async function advanceTurnQueueNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const queue = getTurnQueue(state);
  const head = queue[0];
  if (!head) {
    return {
      ...patchTurn(state, { activeKind: null }),
      ...directionsProgressIfWaiting(state),
    };
  }

  const nextQueue = queue.slice(1);
  const completed = getCompletedTurnKinds(state);
  return {
    ...patchTurn(state, {
      queue: nextQueue,
      completedKinds: [...completed, head],
      activeKind: null,
    }),
    ...(nextQueue.length === 0 ? directionsProgressIfWaiting(state) : {}),
  };
}
