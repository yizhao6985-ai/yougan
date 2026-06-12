import type { WorkProfile } from "../../models/work/profile.js";
import type { WorkProduction } from "../../models/work/production.js";
import type { WorkReference } from "../../models/work/reference.js";
import { parseProductionFromLegacyFields } from "./production.js";
import { parseProfileJson, resolveReferencesFromWork } from "./profile.js";

/** 作品状态字段（API Work 响应与前端 normalize 共用） */
export type NormalizableWorkFields = {
  profile?: WorkProfile | unknown;
  references?: WorkReference[] | unknown;
  production?: WorkProduction | unknown;
  /** 旧 wire / 快照字段，parseProductionFromLegacyFields 合并 */
  productionPlan?: WorkProduction | unknown;
  preview?: unknown | null;
  groupId?: string | null;
  headVersionId?: string | null;
  sourceWorkId?: string | null;
  sourceVersionId?: string | null;
};

/** 规范化作品 JSON 字段与空值 */
export function normalizeWorkDto<T extends NormalizableWorkFields>(work: T): T {
  const production = parseProductionFromLegacyFields({
    production: work.production,
    productionPlan: work.productionPlan,
    preview: work.preview,
  });

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
    production,
  };
}
