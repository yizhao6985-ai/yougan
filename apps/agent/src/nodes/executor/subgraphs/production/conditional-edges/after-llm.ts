/** production 子图 llmCall / designLlmCall 之后：有 tool_calls 则进 tools */
export {
  afterLlmFrom as fromLlm,
  afterLlmPaths as paths,
  shouldContinueAfterLlm as shouldContinueFromDesign,
  shouldContinueAfterLlm as shouldContinueFromLlm,
} from "#agent/lib/graph/after-llm.js";

export const fromDesign = "designLlmCall" as const;
