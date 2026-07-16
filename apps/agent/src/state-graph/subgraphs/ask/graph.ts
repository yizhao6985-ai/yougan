import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import {
  LLM_TIMEOUT_MS,
  llmTimeoutOnly,
} from "#agent/llm/invoke/timeout.js";
import { AgentState } from "#agent/state.js";

import {
  asNodeErrorHandler,
  withErrorHandlerDrawingPath,
} from "../../helpers/as-node-error-handler.js";
import * as afterAnswerQuestion from "./conditional-edges/after-answer-question.js";
import {
  answerQuestionErrorHandler,
  answerQuestionNode,
} from "./nodes/answer-question/node.js";
import { runAskToolsNode } from "./nodes/run-ask-tools/node.js";

export const askGraph = new StateGraph(AgentState)
  .addNode("answerQuestion", answerQuestionNode, {
    ...llmTimeoutOnly(LLM_TIMEOUT_MS.chat),
    errorHandler: asNodeErrorHandler(answerQuestionErrorHandler),
  })
  .addNode("runAskTools", runAskToolsNode)
  .addEdge(START, "answerQuestion")
  .addConditionalEdges(
    afterAnswerQuestion.from,
    toolsCondition,
    withErrorHandlerDrawingPath(
      "answerQuestion",
      afterAnswerQuestion.paths,
    ),
  )
  .addEdge("runAskTools", "answerQuestion")
  .compile();
