import type { WorkBrief } from "../../models/work/brief.js";
import type { WorkDraft } from "../../models/work/draft.js";
import type { WorkOutline } from "../../models/work/outline.js";
import type { WorkProductionPlan } from "../../models/work/plan.js";
import type { WorkProfile } from "../../models/work/profile.js";
import { EMPTY_WORK_PROFILE } from "../../models/work/profile.js";
import { parseBriefJson } from "./brief.js";
import { parseOutlineJson } from "./outline.js";
import { parsePlanJson } from "./plan.js";
import { parseWorkProfile } from "../revision-snapshot.js";

/** 作品状态字段（API DTO 与前端 Work 类型共用） */
export type NormalizableWorkFields = {
  profile?: WorkProfile;
  brief?: WorkBrief;
  outline?: WorkOutline;
  plan?: WorkProductionPlan;
  draft?: WorkDraft | null;
  groupId?: string | null;
  headRevisionId?: string | null;
  sourceWorkId?: string | null;
  sourceRevisionId?: string | null;
};

/** 规范化作品 JSON 字段与空值 */
export function normalizeWorkDto<T extends NormalizableWorkFields>(work: T): T {
  return {
    ...work,
    groupId: work.groupId ?? null,
    headRevisionId: work.headRevisionId ?? null,
    sourceWorkId: work.sourceWorkId ?? null,
    sourceRevisionId: work.sourceRevisionId ?? null,
    profile: work.profile
      ? parseWorkProfile(work.profile)
      : { ...EMPTY_WORK_PROFILE, references: [] },
    outline: parseOutlineJson(work.outline),
    plan: parsePlanJson(work.plan),
    brief: parseBriefJson(work.brief),
    draft: work.draft ?? null,
  };
}
