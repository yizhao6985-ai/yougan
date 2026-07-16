/**
 * 回合末延伸方向（agent 运行时字段，不入库）。
 * 由主图节点 generateTurnDirections 写入 state.turnDirections。
 */

/** @deprecated 旧 checkpoint 可能仍带 role；新生成不再写入 */
export const PROFILE_SETUP_DIRECTION_ROLES = ["refine", "navigate"] as const;

/** @deprecated 旧 checkpoint 兼容 */
export type ProfileSetupDirectionRole =
  (typeof PROFILE_SETUP_DIRECTION_ROLES)[number];

/** 单条可点击延伸方向 */
export interface TurnDirection {
  id: string;
  /** chip 短标题 */
  label: string;
  /** 点击后填入输入框的完整消息 */
  prompt: string;
  /** 走此方向对作品/方案的预期效果 */
  outcome: string;
  /** @deprecated 旧 checkpoint 兼容；新生成不再写入 */
  step?: import("../work/profile.js").ProfileStepId | "ready";
  /** @deprecated 旧 checkpoint 兼容；新生成不再写入 */
  role?: ProfileSetupDirectionRole;
}

export interface TurnDirections {
  hint?: string;
  directions: TurnDirection[];
}

export const DEFAULT_TURN_DIRECTIONS_HINT = "点一条继续，或直接输入";

/** 开屏延伸方向条数 */
export const OPENING_TURN_DIRECTIONS_COUNT = 9;

/** 回合末延伸方向条数 */
export const TURN_END_DIRECTIONS_COUNT = 4;

/** LLM 生成 prompt 的目标字数区间（汉字计，含标点） */
export const TURN_DIRECTION_PROMPT_MIN_LENGTH = 12;
export const TURN_DIRECTION_PROMPT_MAX_LENGTH = 48;

/** 前端展示 chip 时的截断上限 */
export const MAX_TURN_DIRECTION_LABEL_DISPLAY_LENGTH =
  TURN_DIRECTION_PROMPT_MAX_LENGTH;
