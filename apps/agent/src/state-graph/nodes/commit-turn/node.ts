import { commitPending, rollbackPending } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** 提交 staging → canonical；取消则回滚 */
export async function commitTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (state.turnCancelled) {
    return rollbackPending();
  }

  if (!state.staging) {
    return { turnCommitted: false };
  }

  return {
    ...commitPending(state),
    turnCommitted: true,
    turnCancelled: false,
  };
}
