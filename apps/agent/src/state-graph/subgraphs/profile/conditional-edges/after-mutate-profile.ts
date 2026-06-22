/** mutateProfile 之后：有待执行 tool_calls 则跑方案工具，否则结束子图 */
import { hasPendingAiToolCalls } from "#agent/messages/pending-tool-calls.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "mutateProfile" as const;

export const paths = {
  tools: "runProfileTools",
  __end__: "__end__",
} as const;

export function selectAfterMutateProfile(
  state: AgentStateType,
): keyof typeof paths {
  return hasPendingAiToolCalls(state.messages) ? "tools" : "__end__";
}
