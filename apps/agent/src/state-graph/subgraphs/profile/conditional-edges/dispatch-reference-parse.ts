/** tool-node：参考素材解析入队则进 work 节点，否则回 llm-call */
import { getProfileStagingMeta } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "tool-node" as const;

export type ReferenceParseTarget =
  | "llm-call"
  | "parseReferenceText"
  | "parseReferenceImage";

export function dispatchReferenceParse(
  state: AgentStateType,
): ReferenceParseTarget {
  const meta = getProfileStagingMeta(state);
  if (meta?.pendingParseReferenceText?.trim()) {
    return "parseReferenceText";
  }
  if (meta?.pendingParseReferenceImage?.image_url) {
    return "parseReferenceImage";
  }
  return "llm-call";
}

export const paths: ReferenceParseTarget[] = [
  "llm-call",
  "parseReferenceText",
  "parseReferenceImage",
];
