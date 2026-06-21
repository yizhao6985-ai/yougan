import type { RunnableConfig } from "@langchain/core/runnables";

import { clearRevisionItems } from "@yougan/domain";
import {
  getRevision,
  patchPendingRevision,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/** 改稿成功：清空 open revision items */
export async function finalizeRevisionNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const revision = getRevision(state);
  return patchPendingRevision(state, clearRevisionItems(revision));
}
