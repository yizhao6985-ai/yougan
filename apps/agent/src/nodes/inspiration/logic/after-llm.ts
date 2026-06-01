/**
 * 灵感 LLM 节点之后：有 tool_calls → tools，否则 → generateSuggestions。
 */
import type { ConditionalEdgeRouter } from "@langchain/langgraph";

import { lastAiMessageHasToolCalls } from "../../../lib/graph/index.js";
import { AgentState } from "../../../state.js";

export const from = "llmCall" as const;

type AfterLlmTarget = "tools" | "generateSuggestions";

export const shouldContinue: ConditionalEdgeRouter<
  typeof AgentState,
  Record<string, unknown>,
  AfterLlmTarget
> = (state) => (lastAiMessageHasToolCalls(state) ? "tools" : "generateSuggestions");

export const paths: AfterLlmTarget[] = ["tools", "generateSuggestions"];
