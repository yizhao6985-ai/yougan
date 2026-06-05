/** 下一步可点击建议（运行时，不入库） */
export interface NextStepSuggestion {
  id: string;
  kind: "explore" | "confirm" | "navigate";
  label: string;
  message: string;
}

export interface NextStepSuggestions {
  hint?: string;
  suggestions: NextStepSuggestion[];
}

export const DEFAULT_NEXT_STEP_SUGGESTIONS_HINT = "点一条继续，或直接输入";

/** 前端展示建议气泡时的参考字数（仅 UI，不截断 API 返回） */
export const MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH = 48;
