/** 参考素材预处理：对待分析资源生成预处理 tool_calls */
import type { RunnableConfig } from "@langchain/core/runnables";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { emitPreprocessToolCalls } from "./helpers/emit-preprocess-tool-calls.js";
import { listUnprocessedReferenceJobs } from "./helpers/list-unprocessed-jobs.js";

export async function preprocessReferencesNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const jobs = listUnprocessedReferenceJobs(state);
  if (!jobs.length) return {};

  const message = emitPreprocessToolCalls(jobs);
  if (!message) return {};

  return { messages: [message] };
}
