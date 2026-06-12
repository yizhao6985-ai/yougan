/**
 * turn 工作区生命周期：fork、提交、回滚、归一化。
 */
import {
  committedProduction,
  EMPTY_TURN_RUNTIME,
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION,
  EMPTY_WORK_REFERENCES,
  mergeTurnRuntime,
  type TurnQueueKind,
  type TurnRuntime,
  type TurnStaging,
} from "@yougan/domain";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { getTurn, patchTurn } from "./turn.js";

/** 无 staging 时从 state 顶层 fork（工具中途写入前的兜底） */
export function requirePending(state: AgentStateType): TurnStaging {
  const staging = getTurn(state).staging;
  if (staging) return staging;
  return {
    profile: structuredClone(state.profile ?? EMPTY_WORK_PROFILE),
    references: structuredClone(state.references ?? [...EMPTY_WORK_REFERENCES]),
    production: structuredClone(state.production ?? EMPTY_WORK_PRODUCTION),
  };
}

/** planTurnQueue：从 state 顶层 fork 新回合 staging */
export function initPendingTurn(
  state: AgentStateType,
  queue: TurnQueueKind[],
): TurnStaging {
  void queue;
  return {
    profile: structuredClone(state.profile ?? EMPTY_WORK_PROFILE),
    references: structuredClone(state.references ?? [...EMPTY_WORK_REFERENCES]),
    production: structuredClone(state.production ?? EMPTY_WORK_PRODUCTION),
  };
}

/** turn.staging → state 顶层作品字段 */
export function commitPending(
  state: AgentStateType,
): Partial<Pick<AgentStateType, "profile" | "references" | "production">> {
  const staging = getTurn(state).staging;
  if (!staging) return {};
  return {
    profile: staging.profile,
    references: staging.references,
    production: committedProduction(staging.production),
  };
}

export function cancelledTurnPatch(): Partial<TurnRuntime> {
  return {
    staging: null,
    committed: false,
    cancelled: true,
  };
}

/** 是否存在未提交完的回合临时状态 */
export function isDirtyTurnState(state: AgentStateType): boolean {
  const turn = getTurn(state);
  return (
    turn.staging != null ||
    turn.queue.length > 0 ||
    turn.activeKind != null ||
    turn.completedKinds.length > 0 ||
    turn.cancelled === true
  );
}

/** 清空回合临时层；不修改已提交作品字段与 messages */
export function normalizeDirtyTurnState(
  state: AgentStateType,
): AgentStatePatch | null {
  if (!isDirtyTurnState(state)) return null;

  return {
    ...patchTurn(state, {
      ...cancelledTurnPatch(),
      queue: [],
      activeKind: null,
      completedKinds: [],
    }),
    nextStepSuggestions: null,
    generatedConversationTitle: null,
  };
}

export function resetTurnRuntime(): TurnRuntime {
  return { ...EMPTY_TURN_RUNTIME };
}

export function mergeTurnPatch(
  state: AgentStateType,
  patch: Partial<TurnRuntime>,
): TurnRuntime {
  return mergeTurnRuntime(getTurn(state), patch);
}
