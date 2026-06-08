import type { WorkVersionSnapshot } from "../models/work/version.js";
import { EMPTY_WORK_PROFILE } from "../models/work/profile.js";
import { EMPTY_WORK_REFERENCES } from "../models/work/reference.js";
import type { WorkPreview } from "../models/work/preview.js";
import { EMPTY_WORK_PRODUCTION_PLAN } from "../models/work/plan.js";
import { parseProfileJson, resolveReferencesFromWork } from "./work/profile.js";
import { parseProductionPlanJson } from "./work/plan.js";
import { parseReferencesJson } from "./work/reference.js";

export function emptySnapshot(): WorkVersionSnapshot {
  return {
    profile: { ...EMPTY_WORK_PROFILE },
    references: [...EMPTY_WORK_REFERENCES],
    productionPlan: { ...EMPTY_WORK_PRODUCTION_PLAN },
    preview: null,
  };
}

export function parseWorkPreview(raw: unknown): WorkPreview | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as WorkPreview;
  if (!value.body || !value.platform) return null;
  return value;
}

export function parseSnapshot(raw: unknown): WorkVersionSnapshot {
  if (!raw || typeof raw !== "object") return emptySnapshot();
  const value = raw as Record<string, unknown>;
  return {
    profile: parseProfileJson(value.profile),
    references:
      value.references !== undefined
        ? parseReferencesJson(value.references)
        : resolveReferencesFromWork({ profile: value.profile }),
    productionPlan: parseProductionPlanJson(value.productionPlan),
    preview: parseWorkPreview(value.preview),
  };
}

export function snapshotFromAgentValues(
  values: Record<string, unknown>,
): WorkVersionSnapshot {
  return {
    profile: parseProfileJson(values.profile),
    references: resolveReferencesFromWork({
      references: values.references,
      profile: values.profile,
    }),
    productionPlan: parseProductionPlanJson(values.productionPlan),
    preview: parseWorkPreview(values.preview),
  };
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

export function snapshotsEqual(
  a: WorkVersionSnapshot,
  b: WorkVersionSnapshot,
): boolean {
  return stableJson(a) === stableJson(b);
}

export function hasValidPreview(snapshot: WorkVersionSnapshot): boolean {
  return parseWorkPreview(snapshot.preview) !== null;
}

/** 仅当作品预览发生变化且新快照有效时，才追加版本节点 */
export function shouldAppendPreviewVersion(
  previous: WorkVersionSnapshot,
  next: WorkVersionSnapshot,
): boolean {
  return (
    stableJson(previous.preview) !== stableJson(next.preview) &&
    hasValidPreview(next)
  );
}

export function materializeWorkColumns(snapshot: WorkVersionSnapshot) {
  return {
    profile: snapshot.profile,
    references: snapshot.references,
    productionPlan: snapshot.productionPlan,
    preview: snapshot.preview,
  };
}

export function previewVersionSummary(next: WorkVersionSnapshot): string {
  return (
    next.productionPlan.last_execution_summary?.trim() ||
    next.preview?.body?.trim().slice(0, 80) ||
    "生成作品预览"
  );
}
