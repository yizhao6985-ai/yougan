/**
 * 回合结束后的「下一步建议」气泡（运行时生成，不入库）。
 */

/** 下一步建议气泡的 kind 枚举值（LLM 生成约束与 UI 扩展共用） */
export const NEXT_STEP_SUGGESTION_KINDS = [
  "explore",
  "confirm",
  "navigate",
] as const;

/**
 * 下一步建议的交互意图。
 *
 * - `explore` — 继续探索或补充方案：扩写规格、改节拍、补受众/角度等，尚无明确执行动作
 * - `confirm` — 确认现有方案或结论：对已达成的规格、计划或成稿段落给出肯定并推进
 * - `navigate` — 进入下一创作阶段：用户已表达开写/出稿意图时引导开始出稿、改稿或进入制作/发布
 */
export type NextStepSuggestionKind =
  (typeof NEXT_STEP_SUGGESTION_KINDS)[number];

/** 单条可点击建议 */
export interface NextStepSuggestion {
  id: string;
  kind: NextStepSuggestionKind;
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
