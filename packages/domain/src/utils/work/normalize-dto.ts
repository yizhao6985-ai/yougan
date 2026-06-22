import type { WorkProfile } from "../../models/work/profile.js";
import type { WorkProduction } from "../../models/work/production.js";
import type { WorkReference } from "../../models/work/reference.js";
import { parseProductionJson } from "./production.js";
import { parseProfileJson, resolveReferencesFromWork } from "./profile.js";
import { resolvePreviewFromWork } from "./production.js";
import { parseRevisionJson } from "./revision.js";

/** 作品状态字段（API Work 响应与前端 normalize 共用） */
export type NormalizableWorkFields = {
  profile?: WorkProfile | unknown;
  references?: WorkReference[] | unknown;
  production?: WorkProduction | unknown;
  preview?: unknown | null;
  revision?: unknown | null;
  groupId?: string | null;
  headVersionId?: string | null;
  sourceWorkId?: string | null;
  sourceVersionId?: string | null;
};

/** 规范化作品 JSON 字段与空值 */
export function normalizeWorkDto<T extends NormalizableWorkFields>(work: T): T {
  const profile = parseProfileJson(work.profile);
  const production = parseProductionJson(work.production);
  const preview = resolvePreviewFromWork({
    preview: work.preview,
    format: profile.direction.format,
  });
  const revision = parseRevisionJson(work.revision);

  return {
    ...work,
    groupId: work.groupId ?? null,
    headVersionId: work.headVersionId ?? null,
    sourceWorkId: work.sourceWorkId ?? null,
    sourceVersionId: work.sourceVersionId ?? null,
    profile,
    references: resolveReferencesFromWork({
      references: work.references,
    }),
    production,
    preview,
    revision,
  };
}
