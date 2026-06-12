/** 创作回合末：成稿摘要或失败说明写入对话 */
import { AIMessage } from "@langchain/core/messages";

import { getPreview, getProduction } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { buildProductionSummaryMessage } from "../../helpers/summarize-outcome.js";

export async function summarizeProductionNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const content = buildProductionSummaryMessage(
    getProduction(state),
    getPreview(state),
  );
  return { messages: [new AIMessage(content)] };
}
