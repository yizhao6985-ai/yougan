import type { WorkBrief } from "./brief.js";
import type { WorkDraft } from "./draft.js";
import type { WorkOutline } from "./outline.js";
import type { WorkProductionPlan } from "./plan.js";
import type { WorkProfile } from "./profile.js";

/** 作品状态快照，存于 WorkRevision.snapshot */
export interface WorkRevisionSnapshot {
  profile: WorkProfile;
  brief: WorkBrief;
  outline: WorkOutline;
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
}

/** 对外展示的版本阶段 */
export const USER_REVISION_PHASES = ["inspiration", "outline", "draft"] as const;

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

const INSPIRATION_REVISION_KINDS = new Set<RevisionKind>([
  "brief_requirement_added",
  "brief_requirement_updated",
  "brief_requirement_removed",
  "profile_updated",
]);

const OUTLINE_REVISION_KINDS = new Set<RevisionKind>([
  "outline_section_added",
  "outline_section_updated",
  "outline_section_removed",
  "outline_revised",
]);

const DRAFT_REVISION_KINDS = new Set<RevisionKind>(["execution_complete"]);

/** plan 与操作类 revision 不对用户展示 */
export function isUserVisibleRevisionKind(kind: RevisionKind): boolean {
  return userRevisionPhase(kind) !== null;
}

export function userRevisionPhase(kind: RevisionKind): UserRevisionPhase | null {
  if (INSPIRATION_REVISION_KINDS.has(kind)) return "inspiration";
  if (OUTLINE_REVISION_KINDS.has(kind)) return "outline";
  if (DRAFT_REVISION_KINDS.has(kind)) return "draft";
  return null;
}

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
