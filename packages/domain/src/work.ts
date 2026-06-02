import type { WorkBrief } from "./brief.js";
import type { WorkDraft } from "./draft.js";
import type { WorkOutline } from "./outline.js";
import type { WorkProductionPlan } from "./plan.js";
import type { WorkProfile } from "./profile.js";

/** API / 前端作品 DTO（当前物化视图 + head revision） */
export interface WorkDTO {
  id: string;
  userId: string;
  groupId: string | null;
  title: string;
  profile: WorkProfile;
  brief: WorkBrief;
  outline: WorkOutline;
  /** 内部创作计划，Agent 持久化用；前端默认不展示 */
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
  headRevisionId: string | null;
  sourceWorkId: string | null;
  sourceRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
}
