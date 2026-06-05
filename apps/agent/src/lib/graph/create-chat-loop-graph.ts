import { START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { StructuredToolInterface } from "@langchain/core/tools";
import type { GraphNode } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";
import type { AgentStateType } from "#agent/state.js";

import {
  afterLlmFrom,
  afterLlmPaths,
  shouldContinueAfterLlm,
} from "./after-llm.js";
import { createLlmCallNode } from "./create-llm-call-node.js";

export type CreateChatLoopGraphOptions = {
  /** 省略时 START 直连 llmCall（如无 bootstrap 等准备逻辑） */
  prepare?: GraphNode<typeof AgentState>;
  tools: StructuredToolInterface[];
  buildPrompt: (state: AgentStateType) => string;
  temperature?: number;
};

/** [prepare →] llmCall ⇄ tools 对话子图 */
export function createChatLoopGraph(options: CreateChatLoopGraphOptions) {
  const llmCall = createLlmCallNode(options);
  const toolNode = new ToolNode(options.tools);

  let workflow = new StateGraph(AgentState)
    .addNode("llmCall", llmCall)
    .addNode("tools", toolNode);

  if (options.prepare) {
    workflow = workflow
      .addNode("prepare", options.prepare)
      .addEdge(START, "prepare")
      .addEdge("prepare", "llmCall");
  } else {
    workflow = workflow.addEdge(START, "llmCall");
  }

  return workflow
    .addConditionalEdges(afterLlmFrom, shouldContinueAfterLlm, afterLlmPaths)
    .addEdge("tools", "llmCall")
    .compile();
}
