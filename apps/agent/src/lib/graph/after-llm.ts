/** chat 子图共用：llmCall 之后有 tool_calls → tools，否则 END */
import { END, type ConditionalEdgeRouter } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { lastAiMessageHasToolCalls } from "./last-ai-message-has-tool-calls.js";

export const afterLlmFrom = "llmCall" as const;

type AfterLlmTarget = "tools" | typeof END;

export const shouldContinueAfterLlm: ConditionalEdgeRouter<
  typeof AgentState,
  Record<string, unknown>,
  AfterLlmTarget
> = (state) => (lastAiMessageHasToolCalls(state) ? "tools" : END);

export const afterLlmPaths: AfterLlmTarget[] = ["tools", END];
