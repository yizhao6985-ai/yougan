import type { WorkBrief } from "./work/brief.js";
import type { WorkDraft } from "./work/draft.js";
import type { WorkOutline } from "./work/outline.js";
import type { WorkProductionPlan } from "./work/plan.js";
import type { WorkProfile } from "./work/profile.js";

/** 作品状态快照，存于 WorkRevision.snapshot */
export interface WorkRevisionSnapshot {
  profile: WorkProfile;
  brief: WorkBrief;
  outline: WorkOutline;
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
}

/** 对外展示的版本阶段（仅内容预览里程碑） */
export const USER_REVISION_PHASES = ["draft"] as const;

export type UserRevisionPhase = (typeof USER_REVISION_PHASES)[number];

export const REVISION_KINDS = [
  "work_created",
  "work_duplicated",
  "work_restored",
  "brief_requirement_added",
  "brief_requirement_updated",
  "brief_requirement_removed",
  "brief_ready",
  "profile_updated",
  "outline_section_added",
  "outline_section_updated",
  "outline_section_removed",
  "outline_ready",
  "outline_revised",
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
