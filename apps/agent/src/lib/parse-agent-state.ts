/**
 * 安全读取 AgentState 字段（staging 优先供 TurnRunner 使用）。
 */
import { env } from "#agent/env.js";
import type { AgentStateType } from "#agent/state.js";
import {
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_REFERENCES,
  type ReferenceItem,
  type TurnQueueKind,
  type WorkPreview,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";

export function parseReferences(state: AgentStateType): ReferenceItem[] {
  const profileRefs = parseProfile(state).references;
  return profileRefs?.length ? profileRefs : [...EMPTY_WORK_REFERENCES];
}

/** 读取 profile：有 staging 时读 staging.profile */
export function parseProfile(state: AgentStateType): WorkProfile {
  return state.staging?.profile ?? state.profile ?? EMPTY_WORK_PROFILE;
}

export function parseProductionPlan(state: AgentStateType): WorkProductionPlan {
  return (
    state.staging?.productionPlan ??
    state.productionPlan ??
    EMPTY_WORK_PRODUCTION_PLAN
  );
}

export function parsePreview(state: AgentStateType): WorkPreview | null {
  return state.staging?.preview ?? state.preview ?? null;
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
