import { END } from "@langchain/langgraph";
import type { ConditionalEdgeRouter } from "@langchain/langgraph";

import { lastAiMessageHasToolCalls } from "#agent/lib/graph/index.js";
import { AgentState } from "#agent/state.js";

export const from = "llmCall" as const;

type AfterLlmTarget = "tools" | typeof END;

export const shouldContinue: ConditionalEdgeRouter<
  typeof AgentState,
  Record<string, unknown>,
  AfterLlmTarget
> = (state) => (lastAiMessageHasToolCalls(state) ? "tools" : END);

export const paths: AfterLlmTarget[] = ["tools", END];
