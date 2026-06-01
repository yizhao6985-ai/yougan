import { compileReactNode } from "../../../../lib/compile-react-node.js";
import * as reactTools from "../../conditional-edges/react-tools/index.js";
import { buildInspirationActionPrompt } from "./prompt.js";
import { INSPIRATION_TOOLS } from "./tools/index.js";

export const inspirationReactNode = compileReactNode({
  tools: INSPIRATION_TOOLS,
  buildSystemPrompt: buildInspirationActionPrompt,
  name: "inspiration",
  conditionalEdge: reactTools,
});
