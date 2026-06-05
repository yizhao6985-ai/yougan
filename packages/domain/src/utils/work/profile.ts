import {
  EMPTY_PROFILE_SPEC,
  EMPTY_PROFILE_VOICE,
  EMPTY_WORK_PROFILE,
  type ProfileBeat,
  type ProfileConstraint,
  type WorkProfile,
} from "../../models/work/profile.js";
import type { ReferenceItem } from "../../models/work/reference.js";
import { EMPTY_WORK_REFERENCES } from "../../models/work/reference.js";
import { normalizeMediaModalities } from "../media-modalities.js";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function newProfileConstraint(description: string): ProfileConstraint {
  return {
    id: newId("constraint"),
    description: description.trim(),
    confirmed_at: new Date().toISOString(),
  };
}

export function newProfileBeat(description: string, intent?: string | null): ProfileBeat {
  return {
    id: newId("beat"),
    description: description.trim(),
    intent: intent?.trim() || null,
    confirmed_at: new Date().toISOString(),
  };
}

export function isProfileEmpty(profile: WorkProfile | undefined): boolean {
  if (!profile) return true;
  const normalized = parseProfileJson(profile);
  return (
    !normalized.premise.trim() &&
    normalized.constraints.length === 0 &&
    normalized.beats.length === 0 &&
    !normalized.spec.platform &&
    !normalized.spec.content_topic
  );
}

export function hasProfileContent(profile: WorkProfile | undefined): boolean {
  if (!profile) return false;
  const normalized = parseProfileJson(profile);
  return normalized.beats.length > 0 || Boolean(normalized.premise.trim());
}

/** 是否具备开写条件（无 ready 字段，纯推导；不强制 platform） */
export function isProfileActionable(profile: WorkProfile | undefined): boolean {
  if (!profile) return false;
  return Boolean(profile.spec.content_topic?.trim() && profile.beats.length >= 1);
}

export function getProfilePremise(profile: WorkProfile): string | null {
  const premise = parseProfileJson(profile).premise.trim();
  if (premise) return premise;
  if (profile.beats.length === 0) return null;
  return profile.beats.map((b) => b.description).join("；");
}

export function parseProfileJson(raw: unknown): WorkProfile {
  if (!raw || typeof raw !== "object") {
    return {
      ...EMPTY_WORK_PROFILE,
      spec: { ...EMPTY_PROFILE_SPEC },
      voice: { ...EMPTY_PROFILE_VOICE },
    };
  }
  const value = raw as Record<string, unknown>;
  const specRaw = (value.spec ?? {}) as Record<string, unknown>;
  const voiceRaw = (value.voice ?? {}) as Record<string, unknown>;

  return {
    spec: {
      platform: typeof specRaw.platform === "string" ? specRaw.platform : null,
      content_topic:
        typeof specRaw.content_topic === "string" ? specRaw.content_topic : null,
      content_type:
        typeof specRaw.content_type === "string" ? specRaw.content_type : null,
      content_format:
        typeof specRaw.content_format === "string" ? specRaw.content_format : null,
      media_modalities: normalizeMediaModalities(
        specRaw.media_modalities ??
          (typeof specRaw.media_modality === "string"
            ? specRaw.media_modality
            : null),
        typeof specRaw.content_format === "string"
          ? specRaw.content_format
          : null,
      ),
    },
    voice: {
      audience: typeof voiceRaw.audience === "string" ? voiceRaw.audience : null,
      tone: typeof voiceRaw.tone === "string" ? voiceRaw.tone : null,
      style: typeof voiceRaw.style === "string" ? voiceRaw.style : null,
      persona: typeof voiceRaw.persona === "string" ? voiceRaw.persona : null,
      goals: Array.isArray(voiceRaw.goals)
        ? voiceRaw.goals.filter((g): g is string => typeof g === "string")
        : [],
    },
    premise: typeof value.premise === "string" ? value.premise : "",
    references: parseReferencesJson(value.references),
    constraints: Array.isArray(value.constraints)
      ? value.constraints
          .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
          .map((item) => ({
            id: String(item.id ?? newId("constraint")),
            description: String(item.description ?? "").trim(),
            confirmed_at:
              typeof item.confirmed_at === "string"
                ? item.confirmed_at
                : new Date().toISOString(),
          }))
          .filter((item) => item.description)
      : [],
    beats: Array.isArray(value.beats)
      ? value.beats
          .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
          .map((item) => ({
            id: String(item.id ?? newId("beat")),
            description: String(item.description ?? "").trim(),
            intent:
              typeof item.intent === "string" && item.intent.trim()
                ? item.intent.trim()
                : null,
            confirmed_at:
              typeof item.confirmed_at === "string"
                ? item.confirmed_at
                : new Date().toISOString(),
          }))
          .filter((item) => item.description)
      : [],
  };
}

export function parseReferencesJson(raw: unknown): ReferenceItem[] {
  if (!Array.isArray(raw)) return [...EMPTY_WORK_REFERENCES];
  return raw.filter((item): item is ReferenceItem => {
    if (!item || typeof item !== "object") return false;
    const row = item as ReferenceItem;
    return (
      (row.source_type === "text" ||
        row.source_type === "image" ||
        row.source_type === "web") &&
      typeof row.summary === "string" &&
      row.summary.trim().length > 0
    );
  });
}

/** 读取作品 profile 列 */
export function resolveProfileFromWork(input: {
  profile?: unknown;
}): WorkProfile {
  return parseProfileJson(input.profile);
}

export function appendProfileReferences(
  profile: WorkProfile,
  items: ReferenceItem[],
): WorkProfile {
  if (!items.length) return profile;
  return { ...profile, references: [...profile.references, ...items] };
}

export function hasProfileBeats(profile: WorkProfile): boolean {
  return profile.beats.length > 0;
}
