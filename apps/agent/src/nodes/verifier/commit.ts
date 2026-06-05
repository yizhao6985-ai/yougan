import { commitTurnStaging } from "@yougan/domain";

import { rollbackStagingState } from "#agent/lib/staging-state.js";
import type { AgentStateType } from "#agent/state.js";

/** 提交 staging → canonical；取消则回滚 */
export async function commitTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (state.turnCancelled) {
    return rollbackStagingState();
  }

  if (!state.staging) {
    return { turnCommitted: false };
  }

  const canonical = commitTurnStaging(state.staging);
  return {
    ...canonical,
    staging: null,
    turnCommitted: true,
    turnCancelled: false,
  };
}
