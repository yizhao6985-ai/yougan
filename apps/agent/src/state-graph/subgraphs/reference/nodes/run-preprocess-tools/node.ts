/** 执行单条 reference 预处理（由图边路由，不依赖 message tool_calls） */
import type { RunnableConfig } from "@langchain/core/runnables";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { runPreprocessReferenceJob } from "./tools/run-preprocess-reference-job.js";

export async function runPreprocessToolsNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  return runPreprocessReferenceJob(state);
}
