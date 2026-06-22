/** 收集改稿意见：解析用户消息并写入 revision 清单 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { enterCollectRevisionNode } from "./nodes/enter-collect-revision/node.js";
import { collectRevisionNode } from "./nodes/collect-revision/node.js";

const workflow = new StateGraph(AgentState)
  .addNode("enterCollectRevision", enterCollectRevisionNode)
  .addNode("collectRevision", collectRevisionNode)
  .addEdge(START, "enterCollectRevision")
  .addEdge("enterCollectRevision", "collectRevision")
  .addEdge("collectRevision", END);

export const collectRevisionGraph = workflow.compile();
