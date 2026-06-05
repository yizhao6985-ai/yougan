import type { RevisionKind, WorkRevisionSnapshot } from "../models/revision.js";
import { EMPTY_WORK_BLUEPRINT } from "../models/work/blueprint.js";
import type { WorkDraft } from "../models/work/draft.js";
import { EMPTY_WORK_PRODUCTION_PLAN } from "../models/work/plan.js";
import { EMPTY_WORK_PROFILE, type WorkProfile } from "../models/work/profile.js";
import { parseBlueprintJson, resolveBlueprintFromWork } from "./work/blueprint.js";
import { parsePlanJson } from "./work/plan.js";

export function emptySnapshot(): WorkRevisionSnapshot {
  return {
    profile: { ...EMPTY_WORK_PROFILE, references: [] },
    blueprint: { ...EMPTY_WORK_BLUEPRINT },
    plan: { ...EMPTY_WORK_PRODUCTION_PLAN },
    draft: null,
  };
}

export function parseWorkProfile(raw: unknown): WorkProfile {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_PROFILE, references: [] };
  }
  const value = raw as WorkProfile;
  return {
    ...EMPTY_WORK_PROFILE,
    ...value,
    references: value.references ?? [],
    content_points: value.content_points ?? [],
    goals: value.goals ?? [],
    style_constraints: value.style_constraints ?? [],
  };
}

export function parseWorkDraft(raw: unknown): WorkDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as WorkDraft;
  if (!value.body || !value.platform) return null;
  return value;
}

export function parseSnapshot(raw: unknown): WorkRevisionSnapshot {
  if (!raw || typeof raw !== "object") return emptySnapshot();
  const value = raw as Record<string, unknown>;
  const profile = parseWorkProfile(value.profile);
  return {
    profile,
    blueprint: resolveBlueprintFromWork({
      blueprint: value.blueprint,
      brief: value.brief as import("../models/work/brief.js").WorkBrief | undefined,
      outline: value.outline as import("../models/work/outline.js").WorkOutline | undefined,
      profile,
    }),
    plan: parsePlanJson(value.plan),
    draft: parseWorkDraft(value.draft),
  };
}

export function snapshotFromAgentValues(
  values: Record<string, unknown>,
): WorkRevisionSnapshot {
  const profile = parseWorkProfile(values.profile);
  return {
    profile,
    blueprint: values.blueprint
      ? parseBlueprintJson(values.blueprint)
      : resolveBlueprintFromWork({
          brief: values.brief as import("../models/work/brief.js").WorkBrief | undefined,
          outline: values.outline as import("../models/work/outline.js").WorkOutline | undefined,
          profile,
        }),
    plan: parsePlanJson(values.plan),
    draft: parseWorkDraft(values.draft),
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
    stableJson(previous.draft) !== stableJson(next.draft) &&
    parseWorkDraft(next.draft)
  ) {
    return "execution_complete";
  }

  if (
    stableJson(previous.blueprint.constraints) !==
    stableJson(next.blueprint.constraints)
  ) {
    if (
      next.blueprint.constraints.length > previous.blueprint.constraints.length
    ) {
      return "blueprint_constraint_added";
    }
    if (
      next.blueprint.constraints.length < previous.blueprint.constraints.length
    ) {
      return "blueprint_constraint_removed";
    }
    return "blueprint_constraint_updated";
  }

  if (stableJson(previous.blueprint.beats) !== stableJson(next.blueprint.beats)) {
    if (next.blueprint.beats.length > previous.blueprint.beats.length) {
      return "blueprint_beat_added";
    }
    if (next.blueprint.beats.length < previous.blueprint.beats.length) {
      return "blueprint_beat_removed";
    }
    return "blueprint_beat_updated";
  }

  if (stableJson(previous.blueprint) !== stableJson(next.blueprint)) {
    return "blueprint_revised";
  }

  if (stableJson(previous.profile) !== stableJson(next.profile)) {
    return "profile_updated";
  }

  if (previous.plan.ready !== next.plan.ready && next.plan.ready) {
    return "plan_ready";
  }

  if (stableJson(previous.plan) !== stableJson(next.plan)) {
    return "plan_revised";
  }

  return "profile_updated";
}

export function revisionSummary(
  kind: RevisionKind,
  _previous: WorkRevisionSnapshot,
  next: WorkRevisionSnapshot,
): string {
  switch (kind) {
    case "execution_complete":
      return (
        next.plan.last_execution_summary?.trim() ||
        next.draft?.body?.trim().slice(0, 80) ||
        "生成作品预览"
      );
    case "blueprint_revised":
      return next.blueprint.premise.trim() || "更新作品方案";
    case "blueprint_beat_added":
      return "新增内容节拍";
    case "blueprint_beat_updated":
      return "更新内容节拍";
    case "blueprint_beat_removed":
      return "删除内容节拍";
    case "blueprint_constraint_added":
      return "新增写作要求";
    case "blueprint_constraint_updated":
      return "更新写作要求";
    case "blueprint_constraint_removed":
      return "删除写作要求";
    case "plan_ready":
      return next.plan.summary?.trim() || "创作计划已定稿";
    case "plan_revised":
      return "更新创作计划";
    case "profile_updated":
      return "更新参考素材";
    case "work_duplicated":
      return "另存为新作品";
    case "work_restored":
      return "回到历史版本";
    case "work_created":
      return "创建作品";
    default:
      return "更新作品状态";
  }
}

export function materializeWorkColumns(snapshot: WorkRevisionSnapshot) {
  return {
    profile: snapshot.profile as object,
    blueprint: snapshot.blueprint as object,
    plan: snapshot.plan as object,
    draft: snapshot.draft ? (snapshot.draft as object) : null,
  };
}
