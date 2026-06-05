import { createLlmCallNode } from "#agent/lib/graph/create-llm-call-node.js";

import { buildDesignLlmPrompt } from "./design-llm-call/prompt.js";
import { buildProductionLlmPrompt } from "./llm-call/prompt.js";
import { PRODUCTION_TOOLS } from "./tools/index.js";

export const llmCall = createLlmCallNode({
  tools: PRODUCTION_TOOLS,
  buildPrompt: buildProductionLlmPrompt,
});

export const designLlmCall = createLlmCallNode({
  tools: PRODUCTION_TOOLS,
  buildPrompt: buildDesignLlmPrompt,
});
