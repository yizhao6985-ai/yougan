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
  /** 方案引导：巩固层 = 当前步；推进层 = 下一步（ready 表示开始制作） */
  step?: import("../work/profile.js").ProfileStepId | "ready";
  /** 方案引导：refine 巩固本步 / navigate 推进下一步 */
  role?: ProfileSetupSuggestionRole;
}

export interface NextStepSuggestions {
  hint?: string;
  suggestions: NextStepSuggestion[];
}

export const DEFAULT_NEXT_STEP_SUGGESTIONS_HINT = "点一条继续，或直接输入";

/** 开屏下一步建议条数 */
export const OPENING_NEXT_STEP_SUGGESTIONS_COUNT = 7;

/** 回合末下一步建议条数（方案引导：巩固 3 + 推进 1） */
export const TURN_NEXT_STEP_SUGGESTIONS_COUNT = 4;

/** 前端展示建议气泡时的参考字数（仅 UI，不截断 API 返回） */
export const MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH = 48;
