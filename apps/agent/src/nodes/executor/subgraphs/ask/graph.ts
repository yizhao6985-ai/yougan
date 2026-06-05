import { createChatLoopGraph } from "#agent/lib/graph/create-chat-loop-graph.js";

import { buildAskPrompt } from "./prompt.js";
import { ASK_TOOLS } from "./tools.js";

/** 提问模式子图：llmCall ⇄ tools */
export const askGraph = createChatLoopGraph({
  tools: ASK_TOOLS,
  buildPrompt: buildAskPrompt,
});
