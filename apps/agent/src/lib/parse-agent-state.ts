/**
 * 安全读取 AgentState 字段，避免各处重复 ?? EMPTY_*。
 */
import { env } from "../env.js";
import type { AgentStateType } from "../state.js";
import {
  EMPTY_WORK_INSPIRATION,
  EMPTY_WORK_OUTLINE,
  EMPTY_WORK_PROFILE,
  type ChatMode,
  type WorkInspiration,
  type WorkOutline,
  type WorkProfile,
} from "../schemas.js";

export function parseProfile(state: AgentStateType): WorkProfile {
  return state.profile ?? EMPTY_WORK_PROFILE;
}

export function parseOutline(state: AgentStateType): WorkOutline {
  return state.outline ?? EMPTY_WORK_OUTLINE;
}

export function parseInspiration(state: AgentStateType): WorkInspiration {
  return state.inspiration ?? EMPTY_WORK_INSPIRATION;
}

export function parseMode(state: AgentStateType): ChatMode {
  return state.mode ?? "inspiration";
}

export function parseModelTemperature(state: AgentStateType): number {
  const value = state.modelTemperature;
  if (value == null || Number.isNaN(value)) {
    return env.minimaxTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(value * 10) / 10));
}
