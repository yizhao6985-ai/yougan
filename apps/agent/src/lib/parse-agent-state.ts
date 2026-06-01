/**
 * 安全读取 AgentState 字段，避免各处重复 ?? EMPTY_*。
 */
import { env } from "../env.js";
import type { AgentStateType } from "../state.js";
import {
  EMPTY_WORK_INSPIRATION,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  CHAT_MODES,
  type ChatMode,
  type WorkInspiration,
  type WorkProductionPlan,
  type WorkProfile,
} from "../schema.js";

export function parseProfile(state: AgentStateType): WorkProfile {
  return state.profile ?? EMPTY_WORK_PROFILE;
}

export function parseProductionPlan(state: AgentStateType): WorkProductionPlan {
  const legacy = (state as AgentStateType & { outline?: WorkProductionPlan })
    .outline;
  return state.plan ?? legacy ?? EMPTY_WORK_PRODUCTION_PLAN;
}

export function parseInspiration(state: AgentStateType): WorkInspiration {
  return state.inspiration ?? EMPTY_WORK_INSPIRATION;
}

export function parseMode(state: AgentStateType): ChatMode {
  const mode = state.mode ?? "inspiration";
  if ((CHAT_MODES as readonly string[]).includes(mode)) {
    return mode;
  }
  return "inspiration";
}

/** 用户「创意度」；仅用于创作团队内的文案/专员生成，不影响 ReAct 编排与结构化流程节点。 */
export function parseModelTemperature(state: AgentStateType): number {
  const value = state.modelTemperature;
  if (value == null || Number.isNaN(value)) {
    return env.llmTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(value * 10) / 10));
}
