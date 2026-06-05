/**
 * 回合 staging 工作区读写：TurnRunner 只 mutate staging，turn.commit 写入 canonical。
 */
import {
  emptyProductionStagingMeta,
  forkTurnStaging,
  type ProductionStagingMeta,
  type TurnStaging,
  type WorkPreview,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";

import type { AgentStateType } from "#agent/state.js";

/** 无 staging 时从 canonical fork（工具中途写入前的兜底） */
export function requireStaging(state: AgentStateType): TurnStaging {
  if (state.staging) return state.staging;
  return forkTurnStaging({
    profile: state.profile,
    productionPlan: state.productionPlan,
    preview: state.preview,
    turnQueue: state.turnQueue ?? [],
  });
}

/** orchestrateTurn：从 canonical fork 新回合 staging */
export function initStagingForTurn(
  state: AgentStateType,
  turnQueue: AgentStateType["turnQueue"],
): TurnStaging {
  return forkTurnStaging({
    profile: state.profile,
    productionPlan: state.productionPlan,
    preview: state.preview,
    turnQueue: turnQueue ?? [],
  });
}

export function patchStaging(
  state: AgentStateType,
  patch: Partial<Pick<TurnStaging, "profile" | "productionPlan" | "preview">>,
): { staging: TurnStaging } {
  const staging = requireStaging(state);
  return {
    staging: {
      ...staging,
      ...patch,
    },
  };
}

export function patchStagingProfile(
  state: AgentStateType,
  profile: WorkProfile,
): { staging: TurnStaging } {
  return patchStaging(state, { profile });
}

export function patchStagingProductionPlan(
  state: AgentStateType,
  productionPlan: WorkProductionPlan,
): { staging: TurnStaging } {
  return patchStaging(state, { productionPlan });
}

export function patchStagingPreview(
  state: AgentStateType,
  preview: WorkPreview | null,
): { staging: TurnStaging } {
  return patchStaging(state, { preview });
}

export function patchStagingProductionMeta(
  state: AgentStateType,
  patch: Partial<ProductionStagingMeta>,
): { staging: TurnStaging } {
  const staging = requireStaging(state);
  const production = {
    ...emptyProductionStagingMeta(),
    ...staging.meta.production,
    ...patch,
  };
  return {
    staging: {
      ...staging,
      meta: { ...staging.meta, production },
    },
  };
}

/** 合并多个 staging patch（工具同时更新 preview + plan + meta） */
export function mergeStagingPatches(
  ...patches: Array<{ staging?: TurnStaging }>
): { staging: TurnStaging } {
  const last = patches.at(-1);
  if (!last?.staging) {
    throw new Error("mergeStagingPatches: no staging patch");
  }
  let merged = last.staging;
  for (const patch of patches.slice(0, -1)) {
    if (!patch.staging) continue;
    merged = {
      ...merged,
      profile: patch.staging.profile ?? merged.profile,
      productionPlan: patch.staging.productionPlan ?? merged.productionPlan,
      preview:
        patch.staging.preview !== undefined
          ? patch.staging.preview
          : merged.preview,
      meta: {
        ...merged.meta,
        ...patch.staging.meta,
        production: {
          ...merged.meta.production,
          ...patch.staging.meta.production,
        },
      },
    };
  }
  return { staging: merged };
}

export function rollbackStagingState(): {
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
