/**
 * 安全读取 AgentState 字段。
 */
import { env } from "#agent/env.js";
import type { AgentStateType } from "#agent/state.js";
import {
  EMPTY_WORK_BLUEPRINT,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  type TurnQueueKind,
  type WorkBlueprint,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";

export function parseProfile(state: AgentStateType): WorkProfile {
  return state.profile ?? EMPTY_WORK_PROFILE;
}

export function parseBlueprint(state: AgentStateType): WorkBlueprint {
  return state.blueprint ?? EMPTY_WORK_BLUEPRINT;
}

export function parseProductionPlan(state: AgentStateType): WorkProductionPlan {
  return state.plan ?? EMPTY_WORK_PRODUCTION_PLAN;
}

export function parseTurnQueue(state: AgentStateType): TurnQueueKind[] {
  return state.turnQueue ?? [];
}

export function parseActiveTurnKind(
  state: AgentStateType,
): TurnQueueKind | null {
  return state.activeTurnKind ?? null;
}

export function parseCompletedTurnKinds(state: AgentStateType): TurnQueueKind[] {
  return state.completedTurnKinds ?? [];
}

export function parseModelTemperature(state: AgentStateType): number {
  const value = state.modelTemperature;
  if (value == null || Number.isNaN(value)) {
    return env.llmTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(value * 10) / 10));
}

/** @deprecated */
export const parseBrief = parseBlueprint;
/** @deprecated */
export const parseOutline = parseBlueprint;
