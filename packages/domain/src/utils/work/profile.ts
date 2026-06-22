import {
  EMPTY_PROFILE_DIRECTION,
  EMPTY_WORK_PROFILE,
  type ProfileDirection,
  type ProfileRequirementItem,
  type ProfileSpecItem,
  type ProfileStyle,
  type WorkProfile,
} from "../../models/work/profile.js";
import {
  isValidContentFormat,
  resolveContentForm,
  type ResolvedContentForm,
} from "../content-form-resolve.js";
import {
  defaultMediaParamsForFormat,
  syncModalitiesWithFormat,
} from "./content-form-media-params.js";
import { inferMediaModalities } from "../media-modalities.js";
import { parseReferencesJson } from "./reference.js";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

const NULLISH_PROFILE_TEXT = new Set(["null", "undefined"]);

/** 方案内可选文本字段：去空白，过滤 null / "null" 等无效占位。 */
export function normalizeProfileTextField(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || NULLISH_PROFILE_TEXT.has(trimmed.toLowerCase())) {
    return null;
  }
  return trimmed;
}

export function newProfileSpecItem(spec: string, prefix = "set"): ProfileSpecItem {
  return {
    id: newId(prefix),
    spec: spec.trim(),
  };
}

export function newProfileRequirementItem(
  spec: string,
): ProfileRequirementItem {
  return newProfileSpecItem(spec, "req");
}

function parseSpecItems(raw: unknown, prefix: string): ProfileSpecItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const spec = typeof item.spec === "string" ? item.spec.trim() : "";
      return {
        id: String(item.id ?? newId(prefix)),
        spec,
      };
    })
    .filter((item) => item.spec);
}

function parseRequirements(raw: unknown): ProfileRequirementItem[] {
  if (Array.isArray(raw)) {
    return parseSpecItems(raw, "req");
  }
  return [];
}

function parseProfileValue(value: Record<string, unknown>): WorkProfile {
  return {
    direction: parseDirection(value.direction),
    style: parseStyle(value.style),
    setting: parseSpecItems(value.setting, "set"),
    requirements: parseRequirements(value.requirements),
    bounds: parseSpecItems(value.bounds, "bnd"),
  };
}

function parseDirection(raw: unknown): ProfileDirection {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PROFILE_DIRECTION };
  const value = raw as Record<string, unknown>;
  const summary = normalizeProfileTextField(value.summary) ?? "";
  const rawFormat = typeof value.format === "string" ? value.format : null;
  const format = isValidContentFormat(rawFormat) ? rawFormat : null;
  return {
    summary,
    format,
    audience: normalizeProfileTextField(value.audience),
  };
}

function parseStyle(raw: unknown): ProfileStyle {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  return {
    verbal: normalizeProfileTextField(value.verbal),
    visual: normalizeProfileTextField(value.visual),
  };
}

export function getDirectionSummary(profile: WorkProfile | undefined): string {
  return parseProfileJson(profile).direction.summary.trim();
}

export function getProfileFormat(
  profile: WorkProfile | undefined,
): import("../../models/content-form/formats.js").ContentFormatId | null {
  return parseProfileJson(profile).direction.format;
}

export function isProfileEmpty(profile: WorkProfile | undefined): boolean {
  if (!profile) return true;
  const normalized = parseProfileJson(profile);
  return (
    !normalized.direction.summary.trim() &&
    !normalized.direction.format &&
    normalized.setting.length === 0 &&
    normalized.requirements.length === 0 &&
    normalized.bounds.length === 0 &&
    !normalizeProfileTextField(normalized.style?.verbal) &&
    !normalizeProfileTextField(normalized.style?.visual) &&
    !normalized.direction.audience?.trim()
  );
}

export function hasProfileContent(profile: WorkProfile | undefined): boolean {
  if (!profile) return false;
  const normalized = parseProfileJson(profile);
  return (
    Boolean(normalized.direction.summary.trim()) ||
    normalized.requirements.length > 0 ||
    normalized.setting.length > 0
  );
}

export function getProfileSummary(profile: WorkProfile): string | null {
  const normalized = parseProfileJson(profile);
  const summary = normalized.direction.summary.trim();
  if (summary) return summary;
  if (normalized.requirements.length === 0) return null;
  return normalized.requirements.map((item) => item.spec).join("；");
}

export function parseProfileJson(raw: unknown): WorkProfile {
  if (!raw || typeof raw !== "object") {
    return {
      ...EMPTY_WORK_PROFILE,
      direction: { ...EMPTY_PROFILE_DIRECTION },
    };
  }
  const value = raw as Record<string, unknown>;

  if (!value.direction || typeof value.direction !== "object") {
    return {
      ...EMPTY_WORK_PROFILE,
      direction: { ...EMPTY_PROFILE_DIRECTION },
    };
  }

  return parseProfileValue(value);
}

export function resolveReferencesFromWork(input: {
  references?: unknown;
}): import("../../models/work/reference.js").WorkReference[] {
  return parseReferencesJson(input.references);
}

export function resolveProfileFromWork(input: {
  profile?: unknown;
}): WorkProfile {
  return parseProfileJson(input.profile);
}

export function resolveContentFormFromProfile(profile: WorkProfile): ResolvedContentForm {
  const normalized = parseProfileJson(profile);
  const format = normalized.direction.format;
  const modalities = syncModalitiesWithFormat(
    format,
    inferModalitiesFromProfile(normalized),
  );
  return resolveContentForm({ format, modalities });
}

export function inferModalitiesFromProfile(
  profile: WorkProfile,
): import("../../models/content-form/modalities.js").MediaModalityId[] {
  const normalized = parseProfileJson(profile);
  return inferMediaModalities({
    contentFormat: normalized.direction.format,
    contentType: normalized.direction.summary,
  });
}

export function getContentFormSpec(profile: WorkProfile): import("../../models/work/profile.js").ContentFormSpec {
  const resolved = resolveContentFormFromProfile(profile);
  return {
    format: resolved.format,
    modalities: resolved.modalities,
  };
}

/** 运行时从 format 推断媒介规格（不入库） */
export function resolveMediaParamsFromProfile(
  profile: WorkProfile,
): import("../../models/work/profile.js").ContentFormMediaParams {
  const normalized = parseProfileJson(profile);
  const contentForm = resolveContentFormFromProfile(normalized);
  return defaultMediaParamsForFormat(contentForm.format, contentForm.modalities);
}
