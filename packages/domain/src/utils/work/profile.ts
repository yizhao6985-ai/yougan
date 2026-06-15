import {
  EMPTY_PROFILE_CONSTRAINTS,
  EMPTY_PROFILE_DELIVERY,
  EMPTY_PROFILE_INTENT,
  EMPTY_PROFILE_STRUCTURE,
  EMPTY_WORK_PROFILE,
  type ConstraintScope,
  type ProfileConstraint,
  type ProfileDeliveryStep,
  type ProfileExpressionStep,
  type ProfileIntentStep,
  type ProfileSegment,
  type ProfileSetting,
  type ProfileSettingKind,
  type SegmentRole,
  type WorkProfile,
} from "../../models/work/profile.js";
import { parseReferencesJson } from "./reference.js";
import {
  isValidContentFormat,
  parseFormatParams,
  resolveDelivery,
  type ResolvedDelivery,
} from "../delivery.js";
import { isMediaModalityId, sortMediaModalities } from "../media-modalities.js";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function newProfileConstraint(
  description: string,
  scope: ConstraintScope = "all",
): ProfileConstraint {
  return {
    id: newId("rule"),
    description: description.trim(),
    scope,
    confirmed_at: new Date().toISOString(),
  };
}

export function newProfileSegment(
  description: string,
  role?: SegmentRole | string | null,
  title?: string | null,
): ProfileSegment {
  const validRoles: SegmentRole[] = [
    "hook",
    "context",
    "point",
    "example",
    "cta",
    "chapter",
    "scene",
    "shot",
    "broll",
    "transition",
    "subject",
    "composition",
    "detail",
    "intro",
    "segment",
    "outro",
    "bridge",
  ];
  const normalizedRole =
    role && validRoles.includes(role as SegmentRole)
      ? (role as SegmentRole)
      : null;
  return {
    id: newId("segment"),
    description: description.trim(),
    role: normalizedRole,
    title: title?.trim() || null,
    confirmed_at: new Date().toISOString(),
  };
}

const VALID_SETTING_KINDS: ProfileSettingKind[] = ["character", "world", "other"];

export function newProfileSetting(
  description: string,
  kind: ProfileSettingKind | string = "other",
  title?: string | null,
): ProfileSetting {
  const normalizedKind = VALID_SETTING_KINDS.includes(kind as ProfileSettingKind)
    ? (kind as ProfileSettingKind)
    : "other";
  return {
    id: newId("setting"),
    description: description.trim(),
    kind: normalizedKind,
    title: title?.trim() || null,
    confirmed_at: new Date().toISOString(),
  };
}

function parseIntent(raw: unknown): ProfileIntentStep {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PROFILE_INTENT };
  const value = raw as Record<string, unknown>;
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const legacyTopic = typeof value.topic === "string" ? value.topic.trim() : "";
  return { summary: summary || legacyTopic };
}

/** 创作定位（第 1 步 canonical 字段） */
export function getIntentSummary(profile: WorkProfile | undefined): string {
  return parseProfileJson(profile).intent.summary.trim();
}

function parseDeliveryStep(raw: unknown): ProfileDeliveryStep {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_PROFILE_DELIVERY };
  }
  const value = raw as Record<string, unknown>;
  const rawModalities = Array.isArray(value.modalities)
    ? value.modalities.filter((item): item is string => typeof item === "string")
    : [];
  const modalities = sortMediaModalities(
    rawModalities.filter(isMediaModalityId),
  );

  const rawFormat =
    typeof value.format === "string" ? value.format : null;
  const format = isValidContentFormat(rawFormat) ? rawFormat : null;
  const params = parseFormatParams(value.params, format);

  return {
    format,
    modalities,
    platform:
      typeof value.platform === "string"
        ? value.platform.trim() || null
        : null,
    category:
      typeof value.category === "string"
        ? (value.category as ProfileDeliveryStep["category"])
        : null,
    params,
  };
}

function parseExpression(raw: unknown): ProfileExpressionStep {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;

  const verbal =
    typeof value.verbal === "string" ? value.verbal.trim() || null : null;
  const visual =
    typeof value.visual === "string" ? value.visual.trim() || null : null;

  return {
    audience: typeof value.audience === "string" ? value.audience : null,
    verbal,
    visual,
  };
}

function parseStructure(raw: unknown): WorkProfile["structure"] {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_PROFILE_STRUCTURE };
  }
  const value = raw as Record<string, unknown>;
  const settings = Array.isArray(value.settings)
    ? value.settings
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          id: String(item.id ?? newId("setting")),
          confirmed_at:
            typeof item.confirmed_at === "string"
              ? item.confirmed_at
              : new Date().toISOString(),
          kind: VALID_SETTING_KINDS.includes(item.kind as ProfileSettingKind)
            ? (item.kind as ProfileSettingKind)
            : "other",
          title: typeof item.title === "string" ? item.title : null,
          description: String(item.description ?? "").trim(),
        }))
        .filter((item) => item.description)
    : [];
  const segments = Array.isArray(value.segments)
    ? value.segments
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          id: String(item.id ?? newId("segment")),
          confirmed_at:
            typeof item.confirmed_at === "string"
              ? item.confirmed_at
              : new Date().toISOString(),
          role:
            typeof item.role === "string"
              ? (item.role as SegmentRole)
              : null,
          title: typeof item.title === "string" ? item.title : null,
          description: String(item.description ?? "").trim(),
        }))
        .filter((item) => item.description)
    : [];

  return { settings, segments };
}

function parseConstraints(raw: unknown): WorkProfile["constraints"] {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_PROFILE_CONSTRAINTS };
  }
  const value = raw as Record<string, unknown>;
  const rules = Array.isArray(value.rules)
    ? value.rules
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          id: String(item.id ?? newId("rule")),
          description: String(item.description ?? "").trim(),
          scope: (
            [
              "all",
              "verbal",
              "visual",
              "audio",
              "video",
            ] as const
          ).includes(item.scope as ConstraintScope)
            ? (item.scope as ConstraintScope)
            : "all",
          confirmed_at:
            typeof item.confirmed_at === "string"
              ? item.confirmed_at
              : new Date().toISOString(),
        }))
        .filter((item) => item.description)
    : [];

  return { rules };
}

export function isProfileEmpty(profile: WorkProfile | undefined): boolean {
  if (!profile) return true;
  const normalized = parseProfileJson(profile);
  return (
    !normalized.intent.summary.trim() &&
    normalized.constraints.rules.length === 0 &&
    normalized.structure.settings.length === 0 &&
    normalized.structure.segments.length === 0 &&
    !normalized.delivery.platform
  );
}

export function hasProfileContent(profile: WorkProfile | undefined): boolean {
  if (!profile) return false;
  const normalized = parseProfileJson(profile);
  return (
    normalized.structure.segments.length > 0 ||
    normalized.structure.settings.length > 0 ||
    Boolean(normalized.intent.summary.trim())
  );
}

export function getProfileSummary(profile: WorkProfile): string | null {
  const normalized = parseProfileJson(profile);
  const summary = normalized.intent.summary.trim();
  if (summary) return summary;
  if (normalized.structure.segments.length === 0) return null;
  return normalized.structure.segments.map((s) => s.description).join("；");
}

export function parseProfileJson(raw: unknown): WorkProfile {
  if (!raw || typeof raw !== "object") {
    return {
      ...EMPTY_WORK_PROFILE,
      intent: { ...EMPTY_PROFILE_INTENT },
      delivery: { ...EMPTY_PROFILE_DELIVERY },
      structure: { ...EMPTY_PROFILE_STRUCTURE },
      constraints: { ...EMPTY_PROFILE_CONSTRAINTS },
    };
  }
  const value = raw as Record<string, unknown>;

  return {
    intent: parseIntent(value.intent),
    delivery: parseDeliveryStep(value.delivery),
    expression: parseExpression(value.expression),
    structure: parseStructure(value.structure),
    constraints: parseConstraints(value.constraints),
  };
}

export function resolveReferencesFromWork(input: {
  references?: unknown;
  profile?: unknown;
}): import("../../models/work/reference.js").WorkReference[] {
  const topLevel = parseReferencesJson(input.references);
  if (topLevel.length) return topLevel;

  if (!input.profile || typeof input.profile !== "object") {
    return parseReferencesJson(undefined);
  }
  const legacy = (input.profile as Record<string, unknown>).references;
  return parseReferencesJson(legacy);
}

export function resolveProfileFromWork(input: {
  profile?: unknown;
}): WorkProfile {
  return parseProfileJson(input.profile);
}

export function resolveDeliveryFromProfile(profile: WorkProfile): ResolvedDelivery {
  const normalized = parseProfileJson(profile);
  return resolveDelivery({
    format: normalized.delivery.format,
    modalities: normalized.delivery.modalities,
    platform: normalized.delivery.platform,
    category: normalized.delivery.category,
  });
}

export function getDeliverySpec(profile: WorkProfile): import("../../models/work/profile.js").DeliverySpec {
  const normalized = parseProfileJson(profile);
  return {
    format: normalized.delivery.format,
    modalities: normalized.delivery.modalities,
    platform: normalized.delivery.platform,
    category: normalized.delivery.category,
  };
}
