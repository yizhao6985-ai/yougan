import { END } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

/** 提问 ReAct：LLM 有 tool_calls 时进入 ToolNode，否则结束 */
export const router = toolsCondition;

export function paths(toolsNodeId: string): [string, typeof END] {
  return [toolsNodeId, END];
}
