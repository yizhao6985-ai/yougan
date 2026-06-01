/**
 * 安全读取 AgentState 字段。
 */
import { env } from "../env.js";
import type { AgentStateType } from "../state.js";
import {
  EMPTY_WORK_BRIEF,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  CHAT_MODES,
  type ChatMode,
  type WorkBrief,
  type WorkProductionPlan,
  type WorkProfile,
} from "../schema.js";

export function parseProfile(state: AgentStateType): WorkProfile {
  return state.profile ?? EMPTY_WORK_PROFILE;
}

export function parseProductionPlan(state: AgentStateType): WorkProductionPlan {
  return state.plan ?? EMPTY_WORK_PRODUCTION_PLAN;
}

export function parseBrief(state: AgentStateType): WorkBrief {
  return state.brief ?? EMPTY_WORK_BRIEF;
}

export function parseMode(state: AgentStateType): ChatMode {
  const mode = state.mode ?? "inspiration";
  if ((CHAT_MODES as readonly string[]).includes(mode)) {
    return mode;
  }
  return "inspiration";
}

export function parseModelTemperature(state: AgentStateType): number {
  const value = state.modelTemperature;
  if (value == null || Number.isNaN(value)) {
    return env.llmTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(value * 10) / 10));
}
