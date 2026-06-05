import type { WorkBlueprint } from "./work/blueprint.js";
import type { WorkDraft } from "./work/draft.js";
import type { WorkProductionPlan } from "./work/plan.js";
import type { WorkProfile } from "./work/profile.js";

/** 作品状态快照，存于 WorkRevision.snapshot */
export interface WorkRevisionSnapshot {
  profile: WorkProfile;
  blueprint: WorkBlueprint;
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
}

/** 对外展示的版本阶段（仅作品预览里程碑） */
export const USER_REVISION_PHASES = ["draft"] as const;

export type UserRevisionPhase = (typeof USER_REVISION_PHASES)[number];

export const REVISION_KINDS = [
  "work_created",
  "work_duplicated",
  "work_restored",
  "profile_updated",
  "blueprint_constraint_added",
  "blueprint_constraint_updated",
  "blueprint_constraint_removed",
  "blueprint_beat_added",
  "blueprint_beat_updated",
  "blueprint_beat_removed",
  "blueprint_revised",
  "plan_ready",
  "plan_revised",
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
