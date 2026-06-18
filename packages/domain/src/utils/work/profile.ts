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
  SEGMENT_ROLES,
  type SegmentRole,
  type WorkProfile,
  type DeliveryMediaParams,
  type TextMediaParams,
} from "../../models/work/profile.js";
import { parseReferencesJson } from "./reference.js";
import {
  isValidContentFormat,
  resolveDelivery,
  type ResolvedDelivery,
} from "../delivery.js";
import {
  defaultMediaParamsForFormat,
  parseDeliveryMediaParams,
  syncModalitiesWithFormat,
} from "./delivery-media-params.js";
import { syncMediaParamsWithModalities } from "./delivery-display.js";
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

const CONSTRAINT_SCOPES: readonly ConstraintScope[] = [
  "all",
  "verbal",
  "visual",
  "audio",
  "video",
];

/** 规范化创作规则 scope；`text`（媒介名）映射为 `verbal` */
export function normalizeConstraintScope(
  value: unknown,
  fallback: ConstraintScope = "all",
): ConstraintScope {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "text") return "verbal";
  return CONSTRAINT_SCOPES.includes(trimmed as ConstraintScope)
    ? (trimmed as ConstraintScope)
    : fallback;
}

/** 结构段 role 仅允许 text / image / audio / video */
export function normalizeSegmentRole(
  value: unknown,
): SegmentRole | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return SEGMENT_ROLES.includes(trimmed as SegmentRole)
    ? (trimmed as SegmentRole)
    : null;
}

export function newProfileSegment(
  description: string,
  role?: SegmentRole | string | null,
  title?: string | null,
): ProfileSegment {
  return {
    id: newId("segment"),
    description: description.trim(),
    role: normalizeSegmentRole(role),
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

/** 将旧版 delivery.params 迁移为 media_params（读路径兼容） */
function migrateLegacyFormatParams(raw: unknown): DeliveryMediaParams {
  if (!raw || typeof raw !== "object") return {};
  const params = raw as Record<string, unknown>;
  const kind = typeof params.kind === "string" ? params.kind : null;

  if (kind === "illustration") {
    return {
      image: {
        aspect_ratio:
          typeof params.aspect_ratio === "string"
            ? params.aspect_ratio
            : undefined,
      },
    };
  }

  if (kind === "video") {
    return {
      video: {
        duration_sec:
          typeof params.duration_sec === "number"
            ? params.duration_sec
            : undefined,
        aspect_ratio:
          typeof params.aspect_ratio === "string"
            ? params.aspect_ratio
            : undefined,
        pacing: typeof params.pacing === "string" ? params.pacing : undefined,
      },
    };
  }

  if (kind === "audio") {
    return {
      audio: {
        duration_sec:
          typeof params.duration_sec === "number"
            ? params.duration_sec
            : undefined,
      },
    };
  }

  if (kind === "text" || params.word_count || params.emoji_level) {
    const wordCountRaw = params.word_count;
    let word_count: TextMediaParams["word_count"];
    if (wordCountRaw && typeof wordCountRaw === "object") {
      const wc = wordCountRaw as Record<string, unknown>;
      word_count = {
        min: typeof wc.min === "number" ? wc.min : undefined,
        max: typeof wc.max === "number" ? wc.max : undefined,
      };
    }
    const emoji = params.emoji_level;
    const emoji_level =
      emoji === "none" || emoji === "light" || emoji === "heavy"
        ? emoji
        : undefined;
    return { text: { word_count, emoji_level } };
  }

  return {};
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
  const syncedModalities = syncModalitiesWithFormat(format, modalities);
  let media_params = parseDeliveryMediaParams(value.media_params);
  if (!Object.keys(media_params).length && value.params) {
    media_params = migrateLegacyFormatParams(value.params);
  }

  return {
    format,
    modalities: syncedModalities,
    media_params: syncMediaParamsWithModalities(
      syncedModalities,
      Object.keys(media_params).length > 0
        ? media_params
        : format
          ? defaultMediaParamsForFormat(format, syncedModalities)
          : {},
    ),
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
          role: normalizeSegmentRole(item.role),
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
          scope: normalizeConstraintScope(item.scope),
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
    !normalized.delivery.format &&
    !normalized.delivery.modalities.length
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
  });
}

export function getDeliverySpec(profile: WorkProfile): import("../../models/work/profile.js").DeliverySpec {
  const normalized = parseProfileJson(profile);
  return {
    format: normalized.delivery.format,
    modalities: normalized.delivery.modalities,
  };
}
