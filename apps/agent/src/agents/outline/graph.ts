/**
 * 大纲模式子图：进入时自动同步 + ReAct 对话。
 *
 *   START → prepare（按灵感/作品对照，必要时自动生成 pending + executed）
 *        → agent（MiniMax ReAct，撰写/定稿大纲）
 *        → END
 */
import { END, START, StateGraph } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { getOutlineAgent } from "../../llm/agent-factory.js";
import { parseModelTemperature } from "../../lib/parse-agent-state.js";
import { syncReferenceImagesFromLatestMessage } from "../../lib/sync-reference-images.js";
import { AgentState, type AgentStateType } from "./state.js";
import {
  shouldAutoSyncOutline,
  syncOutlineFromInspiration,
} from "./sync-from-inspiration.js";

/** 满足 shouldAutoSyncOutline 时，静默调用 syncOutlineFromInspiration 预填大纲 */
async function prepareOutlineFromInspiration(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const refPatch = await syncReferenceImagesFromLatestMessage(state);
  const stateAfterRefs = refPatch.profile
    ? { ...state, profile: refPatch.profile }
    : state;

  if (!shouldAutoSyncOutline(stateAfterRefs)) {
    return refPatch;
  }

  try {
    const outline = await syncOutlineFromInspiration(stateAfterRefs);
    return { ...refPatch, outline };
  } catch {
    return refPatch;
  }
}

async function runOutlineAgent(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
) {
  const agent = getOutlineAgent(parseModelTemperature(state));
  return agent.invoke(state, config);
}

const outlineWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareOutlineFromInspiration)
  .addNode("agent", runOutlineAgent)
  .addEdge(START, "prepare")
  .addEdge("prepare", "agent")
  .addEdge("agent", END);

export const outlineGraph = outlineWorkflow.compile();
