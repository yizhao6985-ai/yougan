/** 改稿子图：执行改稿 → 更新 preview → 清空 revision → 回复感友 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { applyRevisionNode } from "./nodes/apply-revision/node.js";
import { enterReviseNode } from "./nodes/enter-revise/node.js";
import { finalizeRevisionNode } from "./nodes/finalize-revision/node.js";

const workflow = new StateGraph(AgentState)
  .addNode("enterRevise", enterReviseNode)
  .addNode("applyRevision", applyRevisionNode)
  .addNode("finalizeRevision", finalizeRevisionNode)
  .addEdge(START, "enterRevise")
  .addEdge("enterRevise", "applyRevision")
  .addEdge("applyRevision", "finalizeRevision")
  .addEdge("finalizeRevision", END);

export const reviseGraph = workflow.compile();
