import type { RevisionKind, WorkRevisionSnapshot } from "../models/revision.js";
import { EMPTY_WORK_BRIEF } from "../models/work/brief.js";
import type { WorkDraft } from "../models/work/draft.js";
import { EMPTY_WORK_OUTLINE } from "../models/work/outline.js";
import { EMPTY_WORK_PRODUCTION_PLAN } from "../models/work/plan.js";
import { EMPTY_WORK_PROFILE, type WorkProfile } from "../models/work/profile.js";
import { parseBriefJson } from "./work/brief.js";
import { parseOutlineJson } from "./work/outline.js";
import { parsePlanJson } from "./work/plan.js";

export function emptySnapshot(): WorkRevisionSnapshot {
  return {
    profile: { ...EMPTY_WORK_PROFILE, references: [] },
    brief: { ...EMPTY_WORK_BRIEF },
    outline: { ...EMPTY_WORK_OUTLINE },
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
  return {
    profile: parseWorkProfile(value.profile),
    brief: parseBriefJson(value.brief),
    outline: parseOutlineJson(value.outline),
    plan: parsePlanJson(value.plan),
    draft: parseWorkDraft(value.draft),
  };
}

export function snapshotFromAgentValues(
  values: Record<string, unknown>,
): WorkRevisionSnapshot {
  return {
    profile: parseWorkProfile(values.profile),
    brief: parseBriefJson(values.brief),
    outline: parseOutlineJson(values.outline),
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

  if (stableJson(previous.brief.requirements) !== stableJson(next.brief.requirements)) {
    if (next.brief.requirements.length > previous.brief.requirements.length) {
      return "brief_requirement_added";
    }
    if (next.brief.requirements.length < previous.brief.requirements.length) {
      return "brief_requirement_removed";
    }
    return "brief_requirement_updated";
  }

  if (stableJson(previous.outline.sections) !== stableJson(next.outline.sections)) {
    if (next.outline.sections.length > previous.outline.sections.length) {
      return "outline_section_added";
    }
    if (next.outline.sections.length < previous.outline.sections.length) {
      return "outline_section_removed";
    }
    return "outline_section_updated";
  }

  if (stableJson(previous.profile) !== stableJson(next.profile)) {
    return "profile_updated";
  }

  if (stableJson(previous.outline) !== stableJson(next.outline)) {
    return "outline_revised";
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
        "生成内容预览"
      );
    case "outline_ready":
      return next.outline.summary?.trim() || "内容大纲已定稿";
    case "outline_revised":
      return "更新内容大纲";
    case "outline_section_added":
      return "新增大纲条目";
    case "outline_section_updated":
      return "更新大纲条目";
    case "outline_section_removed":
      return "删除大纲条目";
    case "plan_ready":
      return next.plan.summary?.trim() || "创作计划已定稿";
    case "plan_revised":
      return "更新创作计划";
    case "brief_ready":
      return "创作 brief 已定稿";
    case "brief_requirement_added":
      return "新增 brief 需求";
    case "brief_requirement_removed":
      return "删除 brief 需求";
    case "brief_requirement_updated":
      return "更新 brief 需求";
    case "profile_updated":
      return "更新作品特征";
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
    brief: snapshot.brief as object,
    outline: snapshot.outline as object,
    plan: snapshot.plan as object,
    draft: snapshot.draft ? (snapshot.draft as object) : null,
  };
}
