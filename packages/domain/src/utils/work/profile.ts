import {
  EMPTY_PROFILE_DIRECTION,
  EMPTY_WORK_PROFILE,
  SEQUENCE_ROLES,
  type DeliveryMediaParams,
  type ProfileDirection,
  type ProfileSequenceItem,
  type ProfileSpecItem,
  type ProfileStyle,
  type SequenceRole,
  type WorkProfile,
} from "../../models/work/profile.js";
import { parseReferencesJson } from "./reference.js";
import {
  isValidContentFormat,
  resolveDelivery,
  type ResolvedDelivery,
} from "../delivery.js";
import {
  defaultMediaParamsForFormat,
  syncModalitiesWithFormat,
} from "./delivery-media-params.js";
import { inferMediaModalities, sortMediaModalities } from "../media-modalities.js";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function newProfileSpecItem(spec: string, prefix = "ctx"): ProfileSpecItem {
  return {
    id: newId(prefix),
    spec: spec.trim(),
  };
}

export function newProfileSequenceItem(
  spec: string,
  role?: SequenceRole | string | null,
): ProfileSequenceItem {
  return {
    id: newId("seq"),
    spec: spec.trim(),
    role: normalizeSequenceRole(role),
  };
}

export function normalizeSequenceRole(value: unknown): SequenceRole | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return SEQUENCE_ROLES.includes(trimmed as SequenceRole)
    ? (trimmed as SequenceRole)
    : null;
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

function parseSequence(raw: unknown): ProfileSequenceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const spec = typeof item.spec === "string" ? item.spec.trim() : "";
      return {
        id: String(item.id ?? newId("seq")),
        spec,
        role: normalizeSequenceRole(item.role),
      };
    })
    .filter((item) => item.spec);
}

function parseDirection(raw: unknown): ProfileDirection {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PROFILE_DIRECTION };
  const value = raw as Record<string, unknown>;
  const summary =
    typeof value.summary === "string" ? value.summary.trim() : "";
  const rawFormat = typeof value.format === "string" ? value.format : null;
  const format = isValidContentFormat(rawFormat) ? rawFormat : null;
  const audience =
    typeof value.audience === "string" ? value.audience.trim() || null : null;
  return {
    summary,
    format,
    audience,
  };
}

function parseStyle(raw: unknown): ProfileStyle {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  return {
    verbal:
      typeof value.verbal === "string" ? value.verbal.trim() || null : null,
    visual:
      typeof value.visual === "string" ? value.visual.trim() || null : null,
  };
}

export function getDirectionSummary(profile: WorkProfile | undefined): string {
  return parseProfileJson(profile).direction.summary.trim();
}

export function getProfileFormat(
  profile: WorkProfile | undefined,
): import("../../models/taxonomy/content.js").ContentFormatId | null {
  return parseProfileJson(profile).direction.format;
}

export function isProfileEmpty(profile: WorkProfile | undefined): boolean {
  if (!profile) return true;
  const normalized = parseProfileJson(profile);
  return (
    !normalized.direction.summary.trim() &&
    !normalized.direction.format &&
    normalized.context.length === 0 &&
    normalized.sequence.length === 0 &&
    normalized.bounds.length === 0 &&
    !normalized.style?.verbal?.trim() &&
    !normalized.style?.visual?.trim() &&
    !normalized.direction.audience?.trim()
  );
}

export function hasProfileContent(profile: WorkProfile | undefined): boolean {
  if (!profile) return false;
  const normalized = parseProfileJson(profile);
  return (
    Boolean(normalized.direction.summary.trim()) ||
    normalized.sequence.length > 0 ||
    normalized.context.length > 0
  );
}

export function getProfileSummary(profile: WorkProfile): string | null {
  const normalized = parseProfileJson(profile);
  const summary = normalized.direction.summary.trim();
  if (summary) return summary;
  if (normalized.sequence.length === 0) return null;
  return normalized.sequence.map((item) => item.spec).join("；");
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

  return {
    direction: parseDirection(value.direction),
    style: parseStyle(value.style),
    context: parseSpecItems(value.context, "ctx"),
    sequence: parseSequence(value.sequence),
    bounds: parseSpecItems(value.bounds, "bnd"),
  };
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

export function resolveDeliveryFromProfile(profile: WorkProfile): ResolvedDelivery {
  const normalized = parseProfileJson(profile);
  const format = normalized.direction.format;
  const modalities = syncModalitiesWithFormat(
    format,
    inferModalitiesFromProfile(normalized),
  );
  return resolveDelivery({ format, modalities });
}

export function inferModalitiesFromProfile(
  profile: WorkProfile,
): import("../../models/taxonomy/content.js").MediaModalityId[] {
  const normalized = parseProfileJson(profile);
  const fromSequence = normalized.sequence
    .map((item) => item.role)
    .filter((role): role is SequenceRole => role != null);
  if (fromSequence.length) {
    return sortMediaModalities(fromSequence);
  }
  return inferMediaModalities({ contentFormat: normalized.direction.format });
}

export function getDeliverySpec(profile: WorkProfile): import("../../models/work/profile.js").DeliverySpec {
  const resolved = resolveDeliveryFromProfile(profile);
  return {
    format: resolved.format,
    modalities: resolved.modalities,
  };
}

/** 运行时从 format 推断媒介规格（不入库） */
export function resolveMediaParamsFromProfile(
  profile: WorkProfile,
): DeliveryMediaParams {
  const normalized = parseProfileJson(profile);
  const delivery = resolveDeliveryFromProfile(normalized);
  return defaultMediaParamsForFormat(delivery.format, delivery.modalities);
}
