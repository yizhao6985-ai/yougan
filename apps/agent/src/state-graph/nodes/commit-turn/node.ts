import {
  cancelledTurnPatch,
  commitPending,
  patchTurn,
} from "#agent/state-io/index.js";
import { clearRunProgressPatch } from "#agent/state-io/run-progress.js";
import { getTurn } from "#agent/state-io/turn.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/** 提交 turn.staging → state 顶层；并行建议 pending → turnDirections；取消则回滚 */
export async function commitTurnNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const turn = getTurn(state);

  // 取消可在任意节点打断，图未必会走到 commitTurn；保留作兜底。
  if (turn.cancelled) {
    return {
      ...patchTurn(state, cancelledTurnPatch()),
      pendingTurnDirections: null,
    };
  }

  const turnDirections = state.pendingTurnDirections ?? null;

  if (!turn.staging) {
    return {
      ...patchTurn(state, { committed: true }),
      turnDirections,
      pendingTurnDirections: null,
      ...clearRunProgressPatch(),
    };
  }

  return {
    ...commitPending(state),
    ...patchTurn(state, {
      staging: null,
      committed: true,
      cancelled: false,
    }),
    turnDirections,
    pendingTurnDirections: null,
    ...clearRunProgressPatch(),
  };
}
