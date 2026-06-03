import { nanoid } from "nanoid";

/** 灵感模式结构化建议（运行时，不入库） */
export interface BriefSuggestion {
  id: string;
  kind: "explore" | "confirm" | "navigate";
  label: string;
  message: string;
}

export interface BriefSuggestions {
  hint?: string;
  suggestions: BriefSuggestion[];
}

export const DEFAULT_BRIEF_SUGGESTIONS_HINT = "点一条继续，或直接输入";

/** 下一步建议展示文案（message）统一字数上限 */
export const MAX_NEXT_STEP_SUGGESTION_LENGTH = 48;

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
