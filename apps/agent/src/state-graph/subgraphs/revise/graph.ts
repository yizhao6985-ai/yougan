/** 改稿子图：改稿总监排产 → 执行 → 更新 preview → 清空 revision */
import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { applyRevisionNode } from "./nodes/apply-revision/node.js";
import { finalizeRevisionNode } from "./nodes/finalize-revision/node.js";
import { planRevisionNode } from "./nodes/plan-revision/node.js";
import { summarizeRevisionNode } from "./nodes/summarize-revision/node.js";

const workflow = new StateGraph(AgentState)
  .addNode("planRevision", planRevisionNode)
  .addNode("applyRevision", applyRevisionNode)
  .addNode("finalizeRevision", finalizeRevisionNode)
  .addNode("summarizeRevision", summarizeRevisionNode)
  .addEdge(START, "planRevision")
  .addEdge("planRevision", "applyRevision")
  .addEdge("applyRevision", "finalizeRevision")
  .addEdge("finalizeRevision", "summarizeRevision")
  .addEdge("summarizeRevision", END);

export const reviseGraph = workflow.compile();
