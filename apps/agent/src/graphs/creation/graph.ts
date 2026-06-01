/**
 * 创作模式子图：prepare → resolveContentSpec → creativeDirector → 按媒介路由出稿。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import * as routeByModality from "./conditional-edges/route-by-modality/index.js";
import { creativeDirectorNode } from "./nodes/creative-director/index.js";
import { prepareCreationTurnNode } from "./nodes/prepare-turn/index.js";
import { resolveContentSpecNode } from "./nodes/resolve-content-spec/index.js";
import { creationProductionNode } from "./nodes/production/index.js";
import { AgentState } from "../../state.js";

const creationWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareCreationTurnNode)
  .addNode("resolveContentSpec", resolveContentSpecNode)
  .addNode("creativeDirector", creativeDirectorNode)
  .addNode("textProduction", creationProductionNode)
  .addNode("imageProduction", creationProductionNode)
  .addNode("audioProduction", creationProductionNode)
  .addNode("videoProduction", creationProductionNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "resolveContentSpec")
  .addEdge("resolveContentSpec", "creativeDirector")
  .addConditionalEdges(
    routeByModality.from,
    routeByModality.routeByModality,
    routeByModality.paths,
  )
  .addEdge("textProduction", END)
  .addEdge("imageProduction", END)
  .addEdge("audioProduction", END)
  .addEdge("videoProduction", END);

export const creationGraph = creationWorkflow.compile();
