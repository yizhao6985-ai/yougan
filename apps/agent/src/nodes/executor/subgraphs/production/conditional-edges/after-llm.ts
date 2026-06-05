export {
  afterLlmFrom as fromLlm,
  afterLlmPaths as paths,
  shouldContinueAfterLlm as shouldContinueFromDesign,
  shouldContinueAfterLlm as shouldContinueFromLlm,
} from "#agent/lib/graph/after-llm.js";

export const fromDesign = "designLlmCall" as const;
