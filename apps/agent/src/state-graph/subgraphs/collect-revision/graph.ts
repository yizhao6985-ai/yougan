/** 收集改稿意见：解析用户消息并写入 revision 清单 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { collectRevisionNode } from "./nodes/collect-revision/node.js";
import { summarizeCollectRevisionNode } from "./nodes/summarize-collect-revision/node.js";

const workflow = new StateGraph(AgentState)
  .addNode("collectRevision", collectRevisionNode)
  .addNode("summarizeCollectRevision", summarizeCollectRevisionNode)
  .addEdge(START, "collectRevision")
  .addEdge("collectRevision", "summarizeCollectRevision")
  .addEdge("summarizeCollectRevision", END);

export const collectRevisionGraph = workflow.compile();
