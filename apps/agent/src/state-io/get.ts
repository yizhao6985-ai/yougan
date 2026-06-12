/**
 * 读取 AgentState：作品字段 turn.staging 优先；调度读 turn。
 */
import { env } from "#agent/env.js";
import type { AgentStateType } from "#agent/state.js";
import {
  EMPTY_WORK_PRODUCTION,
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_REFERENCES,
  type WorkPreview,
  type WorkProduction,
  type WorkReference,
  type TurnQueueKind,
  type WorkProfile,
} from "@yougan/domain";

import { getTurn } from "./turn.js";

function resolveProduction(state: AgentStateType): WorkProduction {
  const stagingProd = getTurn(state).staging?.production;
  if (stagingProd) return stagingProd;
  return state.production ?? EMPTY_WORK_PRODUCTION;
}

export function getProfile(state: AgentStateType): WorkProfile {
  return (
    getTurn(state).staging?.profile ?? state.profile ?? EMPTY_WORK_PROFILE
  );
}

export function getReferences(state: AgentStateType): WorkReference[] {
  const refs = getTurn(state).staging?.references ?? state.references;
  return refs?.length ? refs : [...EMPTY_WORK_REFERENCES];
}

/** 当前制作状态（staging 优先） */
export function getProduction(state: AgentStateType): WorkProduction {
  return resolveProduction(state);
}

export function getPreview(state: AgentStateType): WorkPreview | null {
  return getProduction(state).preview ?? null;
}

export function getTurnQueue(state: AgentStateType): TurnQueueKind[] {
  return getTurn(state).queue;
}

export function getActiveTurnKind(state: AgentStateType): TurnQueueKind | null {
  return getTurn(state).activeKind;
}

export function getCompletedTurnKinds(state: AgentStateType): TurnQueueKind[] {
  return getTurn(state).completedKinds;
}

export function getModelTemperature(state: AgentStateType): number {
  const value = state.modelTemperature;
  if (value == null || Number.isNaN(value)) {
    return env.llmTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(value * 10) / 10));
}
