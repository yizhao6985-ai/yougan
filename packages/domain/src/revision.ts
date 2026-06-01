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

/** 对外展示的版本阶段（仅灵感 / 成稿） */
export const USER_REVISION_PHASES = ["inspiration", "draft"] as const;

export type UserRevisionPhase = (typeof USER_REVISION_PHASES)[number];

/** 版本节点类型（单线时间轴；plan / 操作类仅内部使用） */
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

const INSPIRATION_REVISION_KINDS = new Set<RevisionKind>([
  "brief_requirement_added",
  "brief_requirement_updated",
  "brief_requirement_removed",
  "brief_ready",
  "profile_updated",
]);

const DRAFT_REVISION_KINDS = new Set<RevisionKind>(["execution_complete"]);

/** 是否应对用户展示（过滤 plan 与操作类 revision） */
export function isUserVisibleRevisionKind(kind: RevisionKind): boolean {
  return userRevisionPhase(kind) !== null;
}

/** 映射为用户可见阶段；不可见则返回 null */
export function userRevisionPhase(kind: RevisionKind): UserRevisionPhase | null {
  if (INSPIRATION_REVISION_KINDS.has(kind)) return "inspiration";
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
