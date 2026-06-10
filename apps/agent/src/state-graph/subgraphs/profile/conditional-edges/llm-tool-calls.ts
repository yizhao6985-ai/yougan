/** llmCall：有 tool_calls 则进 toolNode */
import { END } from "@langchain/langgraph";

export const from = "llmCall" as const;

/** toolsCondition 返回 "tools"，本图节点名为 toolNode */
export const paths = { tools: "toolNode", __end__: END } as const;
