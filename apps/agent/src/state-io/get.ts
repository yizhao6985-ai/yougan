/**
 * 读取 AgentState：作品字段 staging 优先，控制字段读 state 顶层。
 */
import { env } from "#agent/env.js";
import type { AgentStateType } from "#agent/state.js";
import {
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_REFERENCES,
  type ProductionStagingMeta,
  type ProfileStagingMeta,
  type ReferenceItem,
  type TurnQueueKind,
  type WorkPreview,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";

export function getProfile(state: AgentStateType): WorkProfile {
  return state.staging?.profile ?? state.profile ?? EMPTY_WORK_PROFILE;
}

export function getProductionPlan(state: AgentStateType): WorkProductionPlan {
  return (
    state.staging?.productionPlan ??
    state.productionPlan ??
    EMPTY_WORK_PRODUCTION_PLAN
  );
}

export function getPreview(state: AgentStateType): WorkPreview | null {
  return state.staging?.preview ?? state.preview ?? null;
}

export function getReferences(state: AgentStateType): ReferenceItem[] {
  const profileRefs = getProfile(state).references;
  return profileRefs?.length ? profileRefs : [...EMPTY_WORK_REFERENCES];
}

export function getTurnQueue(state: AgentStateType): TurnQueueKind[] {
  return state.turnQueue ?? [];
}

export function getActiveTurnKind(state: AgentStateType): TurnQueueKind | null {
  return state.activeTurnKind ?? null;
}

export function getCompletedTurnKinds(state: AgentStateType): TurnQueueKind[] {
  return state.completedTurnKinds ?? [];
}

export function getModelTemperature(state: AgentStateType): number {
  const value = state.modelTemperature;
  if (value == null || Number.isNaN(value)) {
    return env.llmTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(value * 10) / 10));
}

/** 当前 thread 是否尚无对话内容（无 messages） */
export function isEmptyThread(state: AgentStateType): boolean {
  return (state.messages ?? []).length === 0;
}

export function getProfileStagingMeta(state: AgentStateType): ProfileStagingMeta {
  return {
    pendingParseReferenceText: null,
    pendingParseReferenceImage: null,
    ...state.staging?.meta.profile,
  };
}

export function getProductionStagingMeta(
  state: AgentStateType,
): ProductionStagingMeta {
  return {
    inspectTaskId: null,
    inspectRetryCount: 0,
    lastInspectFeedback: null,
    pendingInspect: false,
    inspectPipeline: null,
    pendingGenerateDraft: false,
    pendingSpawnSpecialist: null,
    ...state.staging?.meta.production,
  };
}
