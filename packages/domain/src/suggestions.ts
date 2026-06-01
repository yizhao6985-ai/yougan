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

export const DEFAULT_BRIEF_SUGGESTIONS_HINT =
  "你可以点选建议快速回复，或在下方输入框自由补充。";

export function newBriefSuggestion(
  kind: BriefSuggestion["kind"],
  label: string,
  message: string,
): BriefSuggestion {
  return { id: nanoid(8), kind, label, message };
}
