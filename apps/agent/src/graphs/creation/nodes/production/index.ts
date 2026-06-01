import { compileReactNode } from "../../../../lib/compile-react-node.js";
import * as reactTools from "../../conditional-edges/react-tools/index.js";
import { buildCreationSystemPrompt } from "./prompt.js";
import { CREATION_TOOLS } from "./tools/index.js";

export const creationProductionNode = compileReactNode({
  tools: CREATION_TOOLS,
  buildSystemPrompt: buildCreationSystemPrompt,
  name: "creation",
  conditionalEdge: reactTools,
});
