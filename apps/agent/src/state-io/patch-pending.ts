/**
 * 写入 turn.staging 工作区。
 */
import {
  mergeProfileState,
  type TurnStaging,
  type WorkProduction,
  type WorkProfile,
  type WorkReference,
  type WorkPreview,
  type WorkRevision,
} from "@yougan/domain";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { requirePending } from "./lifecycle.js";
import { patchTurn } from "./turn.js";

export function patchPending(
  state: AgentStateType,
  patch: Partial<
    Pick<
      TurnStaging,
      "profile" | "references" | "preview" | "revision" | "production"
    >
  >,
): Pick<AgentStatePatch, "turn"> {
  const staging = requirePending(state);
  return patchTurn(state, {
    staging: {
      ...staging,
      ...patch,
      profile: patch.profile
        ? mergeProfileState(staging.profile, patch.profile)
        : staging.profile,
      references: patch.references ?? staging.references,
      preview: patch.preview !== undefined ? patch.preview : staging.preview,
      revision: patch.revision
        ? { ...staging.revision, ...patch.revision }
        : staging.revision,
      production: patch.production
        ? { ...staging.production, ...patch.production }
        : staging.production,
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

export function patchPendingProduction(
  state: AgentStateType,
  production: WorkProduction,
): Pick<AgentStatePatch, "turn"> {
  return patchPending(state, { production });
}

export function patchPendingProductionFields(
  state: AgentStateType,
  patch: Partial<WorkProduction>,
): Pick<AgentStatePatch, "turn"> {
  const staging = requirePending(state);
  return patchPending(state, {
    production: { ...staging.production, ...patch },
  });
}

export function patchPendingPreview(
  state: AgentStateType,
  preview: WorkPreview | null,
): Pick<AgentStatePatch, "turn"> {
  return patchPending(state, { preview });
}

export function patchPendingRevision(
  state: AgentStateType,
  revision: WorkRevision,
): Pick<AgentStatePatch, "turn"> {
  return patchPending(state, { revision });
}

function mergePreviewField(
  merged: WorkPreview | null,
  incoming: WorkPreview | null | undefined,
): WorkPreview | null {
  // patchPending* 返回完整 staging 快照时，未改动的 preview 常为 null，
  // 不应覆盖同 batch 内先前 patch 已写入的 preview。
  if (incoming != null) return incoming;
  return merged;
}

function mergeStagingPatches(stagingPatches: TurnStaging[]): TurnStaging {
  return stagingPatches.reduce(
    (merged, staging) => ({
      ...merged,
      ...staging,
      profile: staging.profile
        ? mergeProfileState(merged.profile, staging.profile)
        : merged.profile,
      references: staging.references ?? merged.references,
      preview: mergePreviewField(merged.preview, staging.preview),
      revision: staging.revision
        ? { ...merged.revision, ...staging.revision }
        : merged.revision,
      production: staging.production
        ? { ...merged.production, ...staging.production }
        : merged.production,
    }),
    stagingPatches[0]!,
  );
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
