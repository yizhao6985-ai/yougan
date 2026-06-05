/** runTools：参考素材解析入队则进 work 节点，否则回 llmCall */
import type { AgentStateType } from "#agent/state.js";

export const from = "runTools" as const;

export type ReferenceParseTarget =
  | "llmCall"
  | "parseReferenceText"
  | "parseReferenceImage";

export function dispatchReferenceParse(
  state: AgentStateType,
): ReferenceParseTarget {
  const meta = state.staging?.meta.profile;
  if (meta?.pendingParseReferenceText?.trim()) {
    return "parseReferenceText";
  }
  if (meta?.pendingParseReferenceImage?.image_url) {
    return "parseReferenceImage";
  }
  return "llmCall";
}

export const paths: ReferenceParseTarget[] = [
  "llmCall",
  "parseReferenceText",
  "parseReferenceImage",
];
