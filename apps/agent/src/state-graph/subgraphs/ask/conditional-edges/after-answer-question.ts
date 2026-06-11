/** answerQuestion 之后：有 tool_calls 则执行 ask 工具 */
import { END } from "@langchain/langgraph";

export const from = "answerQuestion" as const;

/** toolsCondition 返回 "tools"，本图节点名为 runAskTools */
export const paths = { tools: "runAskTools", __end__: END } as const;
