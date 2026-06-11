import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as afterAnswerQuestion from "./conditional-edges/after-answer-question.js";
import { answerQuestionNode } from "./nodes/answer-question/node.js";
import { runAskToolsNode } from "./nodes/run-ask-tools/node.js";

export const askGraph = new StateGraph(AgentState)
  .addNode("answerQuestion", answerQuestionNode)
  .addNode("runAskTools", runAskToolsNode)
  .addEdge(START, "answerQuestion")
  .addConditionalEdges(
    afterAnswerQuestion.from,
    toolsCondition,
    afterAnswerQuestion.paths,
  )
  .addEdge("runAskTools", "answerQuestion")
  .compile();
