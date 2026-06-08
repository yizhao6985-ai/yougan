/**
 * pending 工作区生命周期：fork、提交、回滚。
 */
import {
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_REFERENCES,
  type TurnStaging,
} from "@yougan/domain";

import type { AgentStateType } from "#agent/state.js";

/** 无 staging 时从 state 顶层 fork（工具中途写入前的兜底） */
export function requirePending(state: AgentStateType): TurnStaging {
  if (state.staging) return state.staging;
  return {
    profile: structuredClone(state.profile ?? EMPTY_WORK_PROFILE),
    references: structuredClone(state.references ?? [...EMPTY_WORK_REFERENCES]),
    productionPlan: structuredClone(
      state.productionPlan ?? EMPTY_WORK_PRODUCTION_PLAN,
    ),
    preview: state.preview ? structuredClone(state.preview) : null,
    meta: {
      initialTurnQueue: [...(state.turnQueue ?? [])],
      completedTurns: [],
      outcome: "pending",
      production: {},
    },
  };
}

/** orchestrateTurn：从 state 顶层 fork 新回合 staging */
export function initPendingTurn(
  state: AgentStateType,
  turnQueue: AgentStateType["turnQueue"],
): TurnStaging {
  return {
    profile: structuredClone(state.profile ?? EMPTY_WORK_PROFILE),
    references: structuredClone(state.references ?? [...EMPTY_WORK_REFERENCES]),
    productionPlan: structuredClone(
      state.productionPlan ?? EMPTY_WORK_PRODUCTION_PLAN,
    ),
    preview: state.preview ? structuredClone(state.preview) : null,
    meta: {
      initialTurnQueue: [...(turnQueue ?? [])],
      completedTurns: [],
      outcome: "pending",
      production: {},
    },
  };
}

/** staging → state 顶层字段（不含 turnCommitted 等 flags） */
export function commitPending(
  state: AgentStateType,
): Partial<
  Pick<
    AgentStateType,
    "profile" | "references" | "productionPlan" | "preview" | "staging"
  >
> {
  if (!state.staging) return {};
  return {
    profile: state.staging.profile,
    references: state.staging.references,
    productionPlan: state.staging.productionPlan,
    preview: state.staging.preview,
    staging: null,
  };
}

export function rollbackPending(): {
  staging: null;
  turnCommitted: false;
  turnCancelled: true;
} {
  return {
    staging: null,
    turnCommitted: false,
    turnCancelled: true,
  };
}
