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
