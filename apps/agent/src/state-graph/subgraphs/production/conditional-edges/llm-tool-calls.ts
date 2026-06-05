/** llm-call / design-llm-call：有 tool_calls 则进 tool-node */
import { END } from "@langchain/langgraph";

export const fromLlm = "llm-call" as const;
export const fromDesign = "design-llm-call" as const;

/** toolsCondition 返回 "tools"，本图节点名为 tool-node */
export const paths = { tools: "tool-node", __end__: END } as const;
