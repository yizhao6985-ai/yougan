import type { WorkProfile } from "../../models/work/profile.js";
import type { WorkPreview } from "../../models/work/preview.js";
import type { WorkProductionPlan } from "../../models/work/plan.js";
import { parseProductionPlanJson } from "./plan.js";
import { parseProfileJson } from "./profile.js";

/** 作品状态字段（API DTO 与前端 Work 类型共用） */
export type NormalizableWorkFields = {
  profile?: WorkProfile | unknown;
  productionPlan?: WorkProductionPlan | unknown;
  preview?: WorkPreview | null;
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
    profile: parseProfileJson(work.profile),
    productionPlan: parseProductionPlanJson(work.productionPlan),
    preview: work.preview ?? null,
  };
}
