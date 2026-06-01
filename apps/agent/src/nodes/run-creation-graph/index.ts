import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { creationGraph } from "../../graphs/creation/graph.js";
import type { AgentStateType } from "../../state.js";

export async function runCreationGraphNode(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
) {
  return creationGraph.invoke(state, config);
}
