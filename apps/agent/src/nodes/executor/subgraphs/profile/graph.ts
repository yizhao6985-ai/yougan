import { createChatLoopGraph } from "#agent/lib/graph/create-chat-loop-graph.js";

import { buildProfilePrompt } from "./prompt.js";
import { PROFILE_TOOLS } from "./tools/index.js";

/** 作品方案模式子图：llmCall ⇄ tools */
export const profileGraph = createChatLoopGraph({
  tools: PROFILE_TOOLS,
  buildPrompt: buildProfilePrompt,
});
