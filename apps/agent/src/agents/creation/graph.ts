/**
 * 创作模式子图：解析内容规格 → 按媒介形式路由 → 执行对应 pipeline。
 *
 *   START → resolveContentSpec
 *        → routeByModality
 *             ├─ textCreation
 *             ├─ imageCreation   （当前复用文字 pipeline，notes 含配图建议）
 *             ├─ audioCreation   （当前复用文字 pipeline，口播稿）
 *             └─ videoCreation   （当前复用文字 pipeline，脚本稿）
 *        → clearInspirationChoices（由主 graph 负责）
 */
import { END, START, StateGraph } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { getCreationAgent } from "../../llm/agent-factory.js";
import {
  isValidMediaModality,
  resolveContentSpec,
  routeCreationPipeline,
  type CreationPipelineId,
} from "../../lib/content-spec.js";
import {
  parseModelTemperature,
  parseProfile,
} from "../../lib/parse-agent-state.js";
import { syncReferenceImagesFromLatestMessage } from "../../lib/sync-reference-images.js";
import { AgentState, type AgentStateType } from "../../state.js";

async function prepareCreationTurn(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return syncReferenceImagesFromLatestMessage(state);
}

async function resolveContentSpecNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const profile = resolveContentSpec(parseProfile(state));
  return { profile };
}

function routeByModality(
  state: AgentStateType,
): CreationPipelineId {
  const profile = resolveContentSpec(parseProfile(state));
  const modality = profile.media_modality;
  return routeCreationPipeline(
    isValidMediaModality(modality) ? modality : null,
  );
}

async function runCreationPipeline(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
) {
  const agent = getCreationAgent(parseModelTemperature(state));
  return agent.invoke(state, config);
}

const creationWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareCreationTurn)
  .addNode("resolveContentSpec", resolveContentSpecNode)
  .addNode("textCreation", runCreationPipeline)
  .addNode("imageCreation", runCreationPipeline)
  .addNode("audioCreation", runCreationPipeline)
  .addNode("videoCreation", runCreationPipeline)
  .addEdge(START, "prepare")
  .addEdge("prepare", "resolveContentSpec")
  .addConditionalEdges("resolveContentSpec", routeByModality, {
    text: "textCreation",
    image: "imageCreation",
    audio: "audioCreation",
    video: "videoCreation",
  })
  .addEdge("textCreation", END)
  .addEdge("imageCreation", END)
  .addEdge("audioCreation", END)
  .addEdge("videoCreation", END);

export const creationGraph = creationWorkflow.compile();
