/**
 * suggestions 子图每轮生成的「下一步建议」气泡（agent 运行时字段，不入库）。
 */

/** 方案引导阶段建议角色（槽位配方写入，LLM 不产出） */
export const PROFILE_SETUP_SUGGESTION_ROLES = ["refine", "navigate"] as const;

export type ProfileSetupSuggestionRole =
  (typeof PROFILE_SETUP_SUGGESTION_ROLES)[number];

/** 单条可点击建议 */
export interface NextStepSuggestion {
  id: string;
  /** 点击后填入输入框的完整消息 */
  message: string;
  /** 扩展当前状态 = 当前步/成稿；下一步引导 = 推进或开始制作 */
  step?: import("../work/profile.js").ProfileStepId | "ready";
  /** refine 扩展当前状态 / navigate 下一步引导 */
  role?: ProfileSetupSuggestionRole;
}

export interface NextStepSuggestions {
  hint?: string;
  suggestions: NextStepSuggestion[];
}

export const DEFAULT_NEXT_STEP_SUGGESTIONS_HINT = "点一条继续，或直接输入";

/** 开屏下一步建议条数 */
export const OPENING_NEXT_STEP_SUGGESTIONS_COUNT = 9;

/** 回合末下一步建议条数（方案引导：巩固 3 + 推进 1） */
export const TURN_NEXT_STEP_SUGGESTIONS_COUNT = 4;

/** LLM 生成建议 message 的目标字数区间（汉字计，含标点） */
export const NEXT_STEP_SUGGESTION_MESSAGE_MIN_LENGTH = 12;
export const NEXT_STEP_SUGGESTION_MESSAGE_MAX_LENGTH = 48;

/** 前端展示建议气泡时的截断上限（与 message 上限对齐，避免展示被压成等长） */
export const MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH =
  NEXT_STEP_SUGGESTION_MESSAGE_MAX_LENGTH;
