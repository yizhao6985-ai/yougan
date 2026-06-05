import type { WorkProfile } from "./work/profile.js";
import type { WorkPreview } from "./work/preview.js";
import type { WorkProductionPlan } from "./work/plan.js";

/** 作品状态快照，存于 WorkRevision.snapshot */
export interface WorkRevisionSnapshot {
  profile: WorkProfile;
  productionPlan: WorkProductionPlan;
  preview: WorkPreview | null;
}

/** 对外展示的版本阶段（仅作品预览里程碑） */
export const USER_REVISION_PHASES = ["preview"] as const;

export type UserRevisionPhase = (typeof USER_REVISION_PHASES)[number];

export const REVISION_KINDS = [
  "work_created",
  "work_duplicated",
  "work_restored",
  "references_updated",
  "profile_constraint_added",
  "profile_constraint_updated",
  "profile_constraint_removed",
  "profile_beat_added",
  "profile_beat_updated",
  "profile_beat_removed",
  "profile_revised",
  "production_plan_ready",
  "production_plan_revised",
  "execution_complete",
] as const;

export type RevisionKind = (typeof REVISION_KINDS)[number];

export interface WorkRevisionDTO {
  id: string;
  workId: string;
  parentRevisionId: string | null;
  conversationId: string | null;
  kind: RevisionKind;
  phase: UserRevisionPhase;
  summary: string;
  snapshot: WorkRevisionSnapshot;
  createdAt: string;
}
