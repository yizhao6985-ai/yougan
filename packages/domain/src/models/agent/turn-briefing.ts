/**
 * 回合简报：结构化延伸方向（agent 运行时字段，不入库）。
 * 由 turn-briefing 子图 generateTurnDirections 写入 state.turnDirections。
 */

/** 方案引导阶段方向角色（槽位配方写入，LLM 不产出） */
export const PROFILE_SETUP_DIRECTION_ROLES = ["refine", "navigate"] as const;

export type ProfileSetupDirectionRole =
  (typeof PROFILE_SETUP_DIRECTION_ROLES)[number];

/** 单条可点击延伸方向 */
export interface TurnDirection {
  id: string;
  /** chip 短标题 */
  label: string;
  /** 点击后填入输入框的完整消息 */
  prompt: string;
  /** 走此方向对作品/方案的预期效果（供 composeTurnBriefing 叙述） */
  outcome: string;
  /** 扩展当前状态 = 当前步/成稿；下一步引导 = 推进或开始制作 */
  step?: import("../work/profile.js").ProfileStepId | "ready";
  /** refine 扩展当前状态 / navigate 下一步引导 */
  role?: ProfileSetupDirectionRole;
}

export interface TurnDirections {
  hint?: string;
  directions: TurnDirection[];
}

export const DEFAULT_TURN_DIRECTIONS_HINT = "点一条继续，或直接输入";

/** 开屏延伸方向条数 */
export const OPENING_TURN_DIRECTIONS_COUNT = 9;

/** 回合末延伸方向条数（方案引导：巩固 3 + 推进 1） */
export const TURN_END_DIRECTIONS_COUNT = 4;

/** LLM 生成 prompt 的目标字数区间（汉字计，含标点） */
export const TURN_DIRECTION_PROMPT_MIN_LENGTH = 12;
export const TURN_DIRECTION_PROMPT_MAX_LENGTH = 48;

/** 前端展示 chip 时的截断上限 */
export const MAX_TURN_DIRECTION_LABEL_DISPLAY_LENGTH =
  TURN_DIRECTION_PROMPT_MAX_LENGTH;
