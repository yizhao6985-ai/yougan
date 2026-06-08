/** reference-turn：有 tool_calls 则进 tool-node */
import { END } from "@langchain/langgraph";

export const from = "reference-turn" as const;

export const paths = { tools: "tool-node", __end__: END } as const;
