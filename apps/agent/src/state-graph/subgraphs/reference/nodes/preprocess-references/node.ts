/** 参考素材预处理调度：跳过不支持的媒介，具体执行由 runPreprocessTools 负责 */
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { applyUnsupportedReferenceSkips } from "../../helpers/skip-unsupported-references.js";
import { listUnprocessedReferenceJobs } from "./helpers/list-unprocessed-jobs.js";

export async function preprocessReferencesNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const jobs = listUnprocessedReferenceJobs(state);
  if (!jobs.length) return {};

  const references = applyUnsupportedReferenceSkips(getReferences(state), jobs);
  return patchPendingReferences(state, references);
}
