/** llmCall：有 tool_calls 则进 runTools */
import { END } from "@langchain/langgraph";

export const from = "llmCall" as const;

/** toolsCondition 返回 "tools"，本图节点名为 runTools */
export const paths = { tools: "runTools", __end__: END } as const;
