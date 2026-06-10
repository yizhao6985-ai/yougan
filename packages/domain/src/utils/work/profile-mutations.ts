import {
  EMPTY_WORK_PROFILE,
  type FormatParams,
  type ProfileDelivery,
  type ProfileExpression,
  type ProfileGuardrail,
  type ProfileSegment,
  type ProfileSetting,
  type ProfileSettingKind,
  type SegmentRole,
  type WorkProfile,
} from "../../models/work/profile.js";
import { defaultParamsForFormat } from "../delivery.js";

export function patchDelivery(
  profile: WorkProfile | undefined,
  delivery: Partial<ProfileDelivery>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const nextFormat = delivery.format ?? base.delivery.format;
  const params =
    delivery.format && delivery.format !== base.delivery.format
      ? defaultParamsForFormat(nextFormat)
      : base.params;

  return {
    ...base,
    delivery: { ...base.delivery, ...delivery },
    params,
  };
}

export function patchExpression(
  profile: WorkProfile | undefined,
  expression: Partial<ProfileExpression>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    expression: {
      audience: expression.audience ?? base.expression.audience,
      verbal: expression.verbal
        ? { ...base.expression.verbal, ...expression.verbal }
        : base.expression.verbal,
      visual: expression.visual
        ? { ...base.expression.visual, ...expression.visual }
        : base.expression.visual,
    },
  };
}

export function setBlueprintSummary(
  profile: WorkProfile | undefined,
  summary: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    blueprint: { ...base.blueprint, summary: summary.trim() },
  };
}

export function updateFormatParams(
  profile: WorkProfile | undefined,
  params: FormatParams,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, params };
}

export function updateGuardrail(
  profile: WorkProfile | undefined,
  guardrailId: string,
  description: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = description.trim();
  if (!trimmed) return base;
  return {
    ...base,
    guardrails: base.guardrails.map((item) =>
      item.id === guardrailId ? { ...item, description: trimmed } : item,
    ),
  };
}

export function deleteGuardrail(
  profile: WorkProfile | undefined,
  guardrailId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    guardrails: base.guardrails.filter((item) => item.id !== guardrailId),
  };
}

export function clearGuardrails(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, guardrails: [] };
}

function normalizeSegmentRole(
  role?: SegmentRole | string | null,
): SegmentRole | null {
  if (!role) return null;
  const valid: SegmentRole[] = [
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
  return valid.includes(role as SegmentRole) ? (role as SegmentRole) : null;
}

export function updateSegment(
  profile: WorkProfile | undefined,
  segmentId: string,
  description: string,
  role?: SegmentRole | string | null,
  title?: string | null,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = description.trim();
  if (!trimmed) return base;
  return {
    ...base,
    blueprint: {
      ...base.blueprint,
      segments: base.blueprint.segments.map((item) =>
        item.id === segmentId
          ? {
              ...item,
              description: trimmed,
              role: role === undefined ? item.role : normalizeSegmentRole(role),
              title: title === undefined ? item.title : title?.trim() || null,
            }
          : item,
      ),
    },
  };
}

export function deleteSegment(
  profile: WorkProfile | undefined,
  segmentId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    blueprint: {
      ...base.blueprint,
      segments: base.blueprint.segments.filter((item) => item.id !== segmentId),
    },
  };
}

export function clearSegments(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    blueprint: { ...base.blueprint, segments: [] },
  };
}

const VALID_SETTING_KINDS: ProfileSettingKind[] = ["character", "world", "other"];

function normalizeSettingKind(
  kind?: ProfileSettingKind | string | null,
): ProfileSettingKind {
  if (kind && VALID_SETTING_KINDS.includes(kind as ProfileSettingKind)) {
    return kind as ProfileSettingKind;
  }
  return "other";
}

export function updateSetting(
  profile: WorkProfile | undefined,
  settingId: string,
  description: string,
  kind?: ProfileSettingKind | string | null,
  title?: string | null,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = description.trim();
  if (!trimmed) return base;
  return {
    ...base,
    blueprint: {
      ...base.blueprint,
      settings: base.blueprint.settings.map((item) =>
        item.id === settingId
          ? {
              ...item,
              description: trimmed,
              kind: kind === undefined ? item.kind : normalizeSettingKind(kind),
              title: title === undefined ? item.title : title?.trim() || null,
            }
          : item,
      ),
    },
  };
}

export function deleteSetting(
  profile: WorkProfile | undefined,
  settingId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    blueprint: {
      ...base.blueprint,
      settings: base.blueprint.settings.filter((item) => item.id !== settingId),
    },
  };
}

export function clearSettings(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    blueprint: { ...base.blueprint, settings: [] },
  };
}

export type { ProfileGuardrail, ProfileSegment, ProfileSetting };
