/** preprocessReferences 之后：有 tool_calls 则执行预处理工具，否则进入 mutate 或继续预处理 */
import { AIMessage } from "@langchain/core/messages";

import type { AgentStateType } from "#agent/state.js";

import { listUnprocessedReferenceJobs } from "../nodes/preprocess-references/helpers/list-unprocessed-jobs.js";

export const from = "preprocessReferences" as const;

export type AfterPreprocessReferencesTarget =
  | "runPreprocessTools"
  | "preprocessReferences"
  | "mutateReferences";

function lastAiHasToolCalls(state: AgentStateType): boolean {
  const last = state.messages?.at(-1);
  return (
    AIMessage.isInstance(last) && (last.tool_calls?.length ?? 0) > 0
  );
}

export function selectAfterPreprocessReferences(
  state: AgentStateType,
): AfterPreprocessReferencesTarget {
  if (lastAiHasToolCalls(state)) return "runPreprocessTools";
  if (listUnprocessedReferenceJobs(state).length > 0) {
    return "preprocessReferences";
  }
  return "mutateReferences";
}

export const paths = {
  runPreprocessTools: "runPreprocessTools",
  preprocessReferences: "preprocessReferences",
  mutateReferences: "mutateReferences",
} as const;
