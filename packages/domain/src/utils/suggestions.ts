import { nanoid } from "nanoid";
import {
  MAX_NEXT_STEP_SUGGESTION_LENGTH,
  type BriefSuggestion,
} from "../models/suggestions.js";

/** 下一步建议 message 写入前的规范化与截断 */
export function sanitizeNextStepSuggestionMessage(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_NEXT_STEP_SUGGESTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_NEXT_STEP_SUGGESTION_LENGTH)}…`;
}

export function newBriefSuggestion(
  kind: BriefSuggestion["kind"],
  label: string,
  message: string,
): BriefSuggestion {
  return { id: nanoid(8), kind, label, message };
}
