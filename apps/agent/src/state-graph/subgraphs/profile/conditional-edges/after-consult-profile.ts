/** consultProfile 之后：有 tool_calls 则执行 profile 工具 */
import { END } from "@langchain/langgraph";

export const from = "consultProfile" as const;

/** toolsCondition 返回 "tools"，本图节点名为 runProfileTools */
export const paths = { tools: "runProfileTools", __end__: END } as const;
