/** referenceTurn：有 tool_calls 则进 toolNode */
import { END } from "@langchain/langgraph";

export const from = "referenceTurn" as const;

export const paths = { tools: "toolNode", __end__: END } as const;
