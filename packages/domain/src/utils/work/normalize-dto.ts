import type { WorkProfile } from "../../models/work/profile.js";
import type { WorkPreview } from "../../models/work/preview.js";
import type { WorkProductionPlan } from "../../models/work/plan.js";
import type { WorkReference } from "../../models/work/reference.js";
import { parseProductionPlanJson } from "./plan.js";
import { parseProfileJson, resolveReferencesFromWork } from "./profile.js";

/** 作品状态字段（API Work 响应与前端 normalize 共用） */
export type NormalizableWorkFields = {
  profile?: WorkProfile | unknown;
  references?: WorkReference[] | unknown;
  productionPlan?: WorkProductionPlan | unknown;
  preview?: WorkPreview | null;
  groupId?: string | null;
  headVersionId?: string | null;
  sourceWorkId?: string | null;
  sourceVersionId?: string | null;
};

/** 规范化作品 JSON 字段与空值 */
export function normalizeWorkDto<T extends NormalizableWorkFields>(work: T): T {
  return {
    ...work,
    groupId: work.groupId ?? null,
    headVersionId: work.headVersionId ?? null,
    sourceWorkId: work.sourceWorkId ?? null,
    sourceVersionId: work.sourceVersionId ?? null,
    profile: parseProfileJson(work.profile),
    references: resolveReferencesFromWork({
      references: work.references,
      profile: work.profile,
    }),
    productionPlan: parseProductionPlanJson(work.productionPlan),
    preview: work.preview ?? null,
  };
}
