import type { RevisionKind, WorkRevisionSnapshot } from "../models/revision.js";
import { EMPTY_WORK_PROFILE } from "../models/work/profile.js";
import type { WorkPreview } from "../models/work/preview.js";
import { EMPTY_WORK_PRODUCTION_PLAN } from "../models/work/plan.js";
import { parseProfileJson } from "./work/profile.js";
import { parseProductionPlanJson } from "./work/plan.js";

export function emptySnapshot(): WorkRevisionSnapshot {
  return {
    profile: { ...EMPTY_WORK_PROFILE },
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

export function parseSnapshot(raw: unknown): WorkRevisionSnapshot {
  if (!raw || typeof raw !== "object") return emptySnapshot();
  const value = raw as Record<string, unknown>;
  return {
    profile: parseProfileJson(value.profile),
    productionPlan: parseProductionPlanJson(value.productionPlan),
    preview: parseWorkPreview(value.preview),
  };
}

export function snapshotFromAgentValues(
  values: Record<string, unknown>,
): WorkRevisionSnapshot {
  return {
    profile: parseProfileJson(values.profile),
    productionPlan: parseProductionPlanJson(values.productionPlan),
    preview: parseWorkPreview(values.preview),
  };
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

export function snapshotsEqual(
  a: WorkRevisionSnapshot,
  b: WorkRevisionSnapshot,
): boolean {
  return stableJson(a) === stableJson(b);
}

export function detectRevisionKind(
  previous: WorkRevisionSnapshot,
  next: WorkRevisionSnapshot,
): RevisionKind {
  if (
    stableJson(previous.preview) !== stableJson(next.preview) &&
    parseWorkPreview(next.preview)
  ) {
    return "execution_complete";
  }

  if (
    stableJson(previous.profile.constraints) !==
    stableJson(next.profile.constraints)
  ) {
    if (next.profile.constraints.length > previous.profile.constraints.length) {
      return "profile_constraint_added";
    }
    if (next.profile.constraints.length < previous.profile.constraints.length) {
      return "profile_constraint_removed";
    }
    return "profile_constraint_updated";
  }

  if (stableJson(previous.profile.beats) !== stableJson(next.profile.beats)) {
    if (next.profile.beats.length > previous.profile.beats.length) {
      return "profile_beat_added";
    }
    if (next.profile.beats.length < previous.profile.beats.length) {
      return "profile_beat_removed";
    }
    return "profile_beat_updated";
  }

  if (
    stableJson(previous.profile.references) !==
    stableJson(next.profile.references)
  ) {
    return "references_updated";
  }

  if (stableJson(previous.profile) !== stableJson(next.profile)) {
    return "profile_revised";
  }

  if (
    previous.productionPlan.ready !== next.productionPlan.ready &&
    next.productionPlan.ready
  ) {
    return "production_plan_ready";
  }

  if (stableJson(previous.productionPlan) !== stableJson(next.productionPlan)) {
    return "production_plan_revised";
  }

  return "references_updated";
}

export function materializeWorkColumns(snapshot: WorkRevisionSnapshot) {
  return {
    profile: snapshot.profile,
    productionPlan: snapshot.productionPlan,
    preview: snapshot.preview,
  };
}

export function revisionSummary(
  kind: RevisionKind,
  _previous: WorkRevisionSnapshot,
  next: WorkRevisionSnapshot,
): string {
  switch (kind) {
    case "execution_complete":
      return (
        next.productionPlan.last_execution_summary?.trim() ||
        next.preview?.body?.trim().slice(0, 80) ||
        "生成作品预览"
      );
    case "profile_revised":
      return next.profile.premise.trim() || "更新作品方案";
    case "profile_beat_added":
      return "新增内容节拍";
    case "profile_beat_updated":
      return "更新内容节拍";
    case "profile_beat_removed":
      return "删除内容节拍";
    case "profile_constraint_added":
      return "新增写作要求";
    case "profile_constraint_updated":
      return "更新写作要求";
    case "profile_constraint_removed":
      return "删除写作要求";
    case "production_plan_ready":
      return next.productionPlan.summary?.trim() || "制作计划已定稿";
    case "production_plan_revised":
      return "更新制作计划";
    case "references_updated":
      return "更新参考素材";
    case "work_duplicated":
      return "另存为新作品";
    case "work_restored":
      return "恢复到该版本";
    case "work_created":
    default:
      return "创建作品";
  }
}
