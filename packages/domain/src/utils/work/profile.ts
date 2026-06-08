import {
  EMPTY_PROFILE_DELIVERY,
  EMPTY_WORK_PROFILE,
  type ProfileBlueprint,
  type ProfileDelivery,
  type ProfileExpression,
  type GuardrailScope,
  type ProfileGuardrail,
  type ProfileSegment,
  type SegmentRole,
  type WorkProfile,
} from "../../models/work/profile.js";
import { parseReferencesJson } from "./reference.js";
import { parseFormatParams, resolveDelivery } from "../delivery.js";
import { routeProductionPipeline } from "../media-modalities.js";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function newProfileGuardrail(
  description: string,
  scope: GuardrailScope = "all",
): ProfileGuardrail {
  return {
    id: newId("guardrail"),
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

function parseExpression(raw: unknown): ProfileExpression {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const verbalRaw = value.verbal;
  const visualRaw = value.visual;

  const verbal =
    verbalRaw && typeof verbalRaw === "object"
      ? {
          tone:
            typeof (verbalRaw as Record<string, unknown>).tone === "string"
              ? ((verbalRaw as Record<string, unknown>).tone as string)
              : null,
          style:
            typeof (verbalRaw as Record<string, unknown>).style === "string"
              ? ((verbalRaw as Record<string, unknown>).style as string)
              : null,
          persona:
            typeof (verbalRaw as Record<string, unknown>).persona === "string"
              ? ((verbalRaw as Record<string, unknown>).persona as string)
              : null,
        }
      : undefined;

  const visual =
    visualRaw && typeof visualRaw === "object"
      ? {
          style:
            typeof (visualRaw as Record<string, unknown>).style === "string"
              ? ((visualRaw as Record<string, unknown>).style as string)
              : null,
          mood:
            typeof (visualRaw as Record<string, unknown>).mood === "string"
              ? ((visualRaw as Record<string, unknown>).mood as string)
              : null,
          palette:
            typeof (visualRaw as Record<string, unknown>).palette === "string"
              ? ((visualRaw as Record<string, unknown>).palette as string)
              : null,
        }
      : undefined;

  return {
    audience: typeof value.audience === "string" ? value.audience : null,
    verbal,
    visual,
  };
}

function parseDelivery(raw: unknown): ProfileDelivery {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_PROFILE_DELIVERY };
  }
  const value = raw as Record<string, unknown>;
  const modalities = Array.isArray(value.modalities)
    ? value.modalities.filter((item): item is string => typeof item === "string")
    : [];

  return resolveDelivery({
    topic: typeof value.topic === "string" ? value.topic : "",
    format:
      typeof value.format === "string"
        ? (value.format as ProfileDelivery["format"])
        : "short_post",
    modalities: modalities as ProfileDelivery["modalities"],
    platform:
      typeof value.platform === "string"
        ? (value.platform as ProfileDelivery["platform"])
        : null,
    category:
      typeof value.category === "string"
        ? (value.category as ProfileDelivery["category"])
        : null,
    intent: typeof value.intent === "string" ? value.intent : null,
  });
}

function parseBlueprint(raw: unknown): ProfileBlueprint {
  if (!raw || typeof raw !== "object") {
    return { summary: "", segments: [] };
  }
  const value = raw as Record<string, unknown>;
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

  return {
    summary: typeof value.summary === "string" ? value.summary : "",
    segments,
  };
}

export function isProfileEmpty(profile: WorkProfile | undefined): boolean {
  if (!profile) return true;
  const normalized = parseProfileJson(profile);
  return (
    !normalized.blueprint.summary.trim() &&
    normalized.guardrails.length === 0 &&
    normalized.blueprint.segments.length === 0 &&
    !normalized.delivery.platform &&
    !normalized.delivery.topic
  );
}

export function hasProfileContent(profile: WorkProfile | undefined): boolean {
  if (!profile) return false;
  const normalized = parseProfileJson(profile);
  return (
    normalized.blueprint.segments.length > 0 ||
    Boolean(normalized.blueprint.summary.trim())
  );
}

export function isProfileActionable(profile: WorkProfile | undefined): boolean {
  if (!profile) return false;
  const normalized = parseProfileJson(profile);
  const delivery = resolveDelivery(normalized.delivery);
  if (!delivery.topic.trim()) return false;

  const pipeline = routeProductionPipeline(delivery.modalities, delivery.format);

  switch (pipeline) {
    case "text":
    case "image":
      return normalized.blueprint.segments.length >= 1;

    case "design":
      return (
        normalized.blueprint.segments.length >= 1 ||
        Boolean(normalized.expression.visual?.style) ||
        (normalized.params.kind === "illustration" &&
          Boolean(normalized.params.aspect_ratio))
      );

    case "audio":
    case "video":
      return (
        normalized.blueprint.segments.length >= 1 ||
        (normalized.params.kind === pipeline &&
          "duration_sec" in normalized.params &&
          Boolean(normalized.params.duration_sec))
      );

    default:
      return normalized.blueprint.segments.length >= 1;
  }
}

export function getProfileSummary(profile: WorkProfile): string | null {
  const normalized = parseProfileJson(profile);
  const summary = normalized.blueprint.summary.trim();
  if (summary) return summary;
  if (normalized.blueprint.segments.length === 0) return null;
  return normalized.blueprint.segments.map((s) => s.description).join("；");
}

/** @deprecated Use getProfileSummary */
export function getProfilePremise(profile: WorkProfile): string | null {
  return getProfileSummary(profile);
}

export function parseProfileJson(raw: unknown): WorkProfile {
  if (!raw || typeof raw !== "object") {
    return {
      ...EMPTY_WORK_PROFILE,
      delivery: { ...EMPTY_PROFILE_DELIVERY },
    };
  }
  const value = raw as Record<string, unknown>;
  const delivery = parseDelivery(value.delivery);
  const params = parseFormatParams(value.params, delivery.format);

  const guardrails = Array.isArray(value.guardrails)
    ? value.guardrails
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          id: String(item.id ?? newId("guardrail")),
          description: String(item.description ?? "").trim(),
          scope: (
            [
              "all",
              "verbal",
              "visual",
              "audio",
              "video",
            ] as const
          ).includes(item.scope as GuardrailScope)
            ? (item.scope as GuardrailScope)
            : "all",
          confirmed_at:
            typeof item.confirmed_at === "string"
              ? item.confirmed_at
              : new Date().toISOString(),
        }))
        .filter((item) => item.description)
    : [];

  return {
    delivery,
    expression: parseExpression(value.expression),
    blueprint: parseBlueprint(value.blueprint),
    guardrails,
    params,
  };
}

/** 从作品 JSON 解析参考素材（顶层 references 优先，兼容旧 profile.references） */
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

export function hasProfileSegments(profile: WorkProfile): boolean {
  return profile.blueprint.segments.length > 0;
}

/** @deprecated Use hasProfileSegments */
export function hasProfileBeats(profile: WorkProfile): boolean {
  return hasProfileSegments(profile);
}

export function resolveDeliveryFromProfile(profile: WorkProfile): ProfileDelivery {
  return resolveDelivery(parseProfileJson(profile).delivery);
}
