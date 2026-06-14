/** 创作回合末：成稿摘要或失败说明写入对话 */
import { AIMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { getProduction } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";
import {
  emitRunProgress,
  patchRunProgress,
} from "#agent/state-io/run-progress.js";

import { buildProductionSummaryMessage } from "./helpers/summarize-outcome.js";
import { productionSummarizeProgress } from "../../helpers/progress-labels.js";

export async function summarizeProductionNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const progress = productionSummarizeProgress();
  emitRunProgress(progress, config);

  const content = buildProductionSummaryMessage(getProduction(state));
  return {
    messages: [new AIMessage(content)],
    ...patchRunProgress(progress),
  };
}
