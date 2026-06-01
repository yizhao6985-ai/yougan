import type { WorkBrief } from "./brief.js";
import type { WorkDraft } from "./draft.js";
import type { WorkProductionPlan } from "./plan.js";
import type { WorkProfile } from "./profile.js";

/** 作品状态快照，存于 WorkRevision.snapshot */
export interface WorkRevisionSnapshot {
  profile: WorkProfile;
  brief: WorkBrief;
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
}

/** 版本节点类型（单线时间轴） */
export const REVISION_KINDS = [
  "work_created",
  "work_duplicated",
  "work_restored",
  "brief_requirement_added",
  "brief_requirement_updated",
  "brief_requirement_removed",
  "brief_ready",
  "profile_updated",
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
  summary: string;
  snapshot: WorkRevisionSnapshot;
  createdAt: string;
}
