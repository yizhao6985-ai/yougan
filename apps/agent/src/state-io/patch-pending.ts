/**
 * 写入 pending（staging）工作区。
 */
import type {
  ProductionStagingMeta,
  ProfileStagingMeta,
  TurnStaging,
  WorkPreview,
  WorkProductionPlan,
  WorkProfile,
} from "@yougan/domain";

import type { AgentStateType } from "#agent/state.js";

import { requirePending } from "./lifecycle.js";

export function patchPending(
  state: AgentStateType,
  patch: Partial<Pick<TurnStaging, "profile" | "productionPlan" | "preview">>,
): { staging: TurnStaging } {
  const staging = requirePending(state);
  return {
    staging: {
      ...staging,
      ...patch,
    },
  };
}

export function patchPendingProfile(
  state: AgentStateType,
  profile: WorkProfile,
): { staging: TurnStaging } {
  return patchPending(state, { profile });
}

export function patchPendingProductionPlan(
  state: AgentStateType,
  productionPlan: WorkProductionPlan,
): { staging: TurnStaging } {
  return patchPending(state, { productionPlan });
}

export function patchPendingPreview(
  state: AgentStateType,
  preview: WorkPreview | null,
): { staging: TurnStaging } {
  return patchPending(state, { preview });
}

export function patchPendingProfileMeta(
  state: AgentStateType,
  patch: Partial<ProfileStagingMeta>,
): { staging: TurnStaging } {
  const staging = requirePending(state);
  const profileMeta = {
    pendingParseReferenceText: null,
    pendingParseReferenceImage: null,
    ...staging.meta.profile,
    ...patch,
  };
  return {
    staging: {
      ...staging,
      meta: { ...staging.meta, profile: profileMeta },
    },
  };
}

export function patchPendingProductionMeta(
  state: AgentStateType,
  patch: Partial<ProductionStagingMeta>,
): { staging: TurnStaging } {
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
  return {
    staging: {
      ...staging,
      meta: { ...staging.meta, production },
    },
  };
}

/** 合并多个 staging patch（同节点内多字段写入） */
export function patchPendingBatch(
  ...patches: Array<{ staging?: TurnStaging }>
): { staging: TurnStaging } {
  const last = patches.at(-1);
  if (!last?.staging) {
    throw new Error("patchPendingBatch: no staging patch");
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
