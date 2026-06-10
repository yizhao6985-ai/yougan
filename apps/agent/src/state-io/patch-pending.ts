/**
 * 写入 turn.staging 工作区。
 */
import type {
  ProductionStagingMeta,
  TurnStaging,
  WorkPreview,
  WorkProductionPlan,
  WorkProfile,
  WorkReference,
} from "@yougan/domain";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { requirePending } from "./lifecycle.js";
import { patchTurn } from "./turn.js";

export function patchPending(
  state: AgentStateType,
  patch: Partial<
    Pick<TurnStaging, "profile" | "references" | "productionPlan" | "preview">
  >,
): Pick<AgentStatePatch, "turn"> {
  const staging = requirePending(state);
  return patchTurn(state, {
    staging: {
      ...staging,
      ...patch,
    },
  });
}

export function patchPendingProfile(
  state: AgentStateType,
  profile: WorkProfile,
): Pick<AgentStatePatch, "turn"> {
  return patchPending(state, { profile });
}

export function patchPendingReferences(
  state: AgentStateType,
  references: WorkReference[],
): Pick<AgentStatePatch, "turn"> {
  return patchPending(state, { references });
}

export function patchPendingProductionPlan(
  state: AgentStateType,
  productionPlan: WorkProductionPlan,
): Pick<AgentStatePatch, "turn"> {
  return patchPending(state, { productionPlan });
}

export function patchPendingPreview(
  state: AgentStateType,
  preview: WorkPreview | null,
): Pick<AgentStatePatch, "turn"> {
  return patchPending(state, { preview });
}

export function patchPendingProductionMeta(
  state: AgentStateType,
  patch: Partial<ProductionStagingMeta>,
): Pick<AgentStatePatch, "turn"> {
  const staging = requirePending(state);
  const production = {
    inspectTaskId: null,
    inspectRetryCount: 0,
    lastInspectFeedback: null,
    pendingInspect: false,
    inspectPipeline: null,
    pendingGenerateDraft: false,
    pendingSpawnSpecialist: null,
    ...staging.meta.production,
    ...patch,
  };
  return patchTurn(state, {
    staging: {
      ...staging,
      meta: { ...staging.meta, production },
    },
  });
}

function mergeStagingPatches(stagingPatches: TurnStaging[]): TurnStaging {
  let merged = stagingPatches[stagingPatches.length - 1]!;
  for (const staging of stagingPatches.slice(0, -1)) {
    merged = {
      ...merged,
      profile: staging.profile ?? merged.profile,
      references: staging.references ?? merged.references,
      productionPlan: staging.productionPlan ?? merged.productionPlan,
      preview:
        staging.preview !== undefined ? staging.preview : merged.preview,
      meta: {
        ...merged.meta,
        ...staging.meta,
        production: {
          ...merged.meta.production,
          ...staging.meta.production,
        },
      },
    };
  }
  return merged;
}

/** 合并多个 turn.staging patch（同节点内多字段写入） */
export function patchPendingBatch(
  state: AgentStateType,
  ...patches: Array<Pick<AgentStatePatch, "turn">>
): Pick<AgentStatePatch, "turn"> {
  const stagingPatches = patches
    .map((patch) => patch.turn?.staging)
    .filter((staging): staging is TurnStaging => staging != null);

  if (stagingPatches.length === 0) {
    throw new Error("patchPendingBatch: no turn.staging patch");
  }

  return patchTurn(state, { staging: mergeStagingPatches(stagingPatches) });
}
