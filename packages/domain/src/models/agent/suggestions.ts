/**
 * 回合结束后的「下一步建议」气泡（运行时生成，不入库）。
 */

/** 单条可点击建议 */
export interface NextStepSuggestion {
  id: string;
  kind: "explore" | "confirm" | "navigate";
  label: string;
  /** 点击后填入输入框的完整消息 */
  message: string;
}

export interface NextStepSuggestions {
  hint?: string;
  suggestions: NextStepSuggestion[];
}

export const DEFAULT_NEXT_STEP_SUGGESTIONS_HINT = "点一条继续，或直接输入";

/** 前端展示建议气泡时的参考字数（仅 UI，不截断 API 返回） */
export const MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH = 48;
