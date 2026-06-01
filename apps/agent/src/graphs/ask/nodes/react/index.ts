import { compileReactNode } from "../../../../lib/compile-react-node.js";
import * as reactTools from "../../conditional-edges/react-tools/index.js";
import { buildAskSystemPrompt } from "./prompt.js";
import { ASK_TOOLS } from "./tools/index.js";

export const askReactNode = compileReactNode({
  tools: ASK_TOOLS,
  buildSystemPrompt: buildAskSystemPrompt,
  name: "ask",
  conditionalEdge: reactTools,
});
