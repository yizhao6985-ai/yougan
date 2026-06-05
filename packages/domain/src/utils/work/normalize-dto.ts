import type { WorkBlueprint } from "../../models/work/blueprint.js";
import type { WorkDraft } from "../../models/work/draft.js";
import type { WorkProductionPlan } from "../../models/work/plan.js";
import type { WorkProfile } from "../../models/work/profile.js";
import { EMPTY_WORK_PROFILE } from "../../models/work/profile.js";
import {
  resolveBlueprintFromWork,
} from "./blueprint.js";
import { parsePlanJson } from "./plan.js";
import { parseWorkProfile } from "../revision-snapshot.js";

/** 作品状态字段（API DTO 与前端 Work 类型共用） */
export type NormalizableWorkFields = {
  profile?: WorkProfile;
  blueprint?: WorkBlueprint | unknown;
  /** @deprecated 迁移用 */
  brief?: unknown;
  /** @deprecated 迁移用 */
  outline?: unknown;
  plan?: WorkProductionPlan;
  draft?: WorkDraft | null;
  groupId?: string | null;
  headRevisionId?: string | null;
  sourceWorkId?: string | null;
  sourceRevisionId?: string | null;
};

/** 规范化作品 JSON 字段与空值 */
export function normalizeWorkDto<T extends NormalizableWorkFields>(work: T): T {
  const profile = work.profile
    ? parseWorkProfile(work.profile)
    : { ...EMPTY_WORK_PROFILE, references: [] };

  const blueprint = resolveBlueprintFromWork({
    blueprint: work.blueprint,
    brief: work.brief as import("../../models/work/brief.js").WorkBrief | undefined,
    outline: work.outline as import("../../models/work/outline.js").WorkOutline | undefined,
    profile,
  });

  return {
    ...work,
    groupId: work.groupId ?? null,
    headRevisionId: work.headRevisionId ?? null,
    sourceWorkId: work.sourceWorkId ?? null,
    sourceRevisionId: work.sourceRevisionId ?? null,
    profile,
    blueprint,
    plan: parsePlanJson(work.plan),
    draft: work.draft ?? null,
  };
}

