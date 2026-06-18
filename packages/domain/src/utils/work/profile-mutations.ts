import {
  EMPTY_WORK_PROFILE,
  type DeliveryMediaParams,
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
import {
  defaultMediaParamsForFormat,
  mergeDeliveryMediaParams,
} from "./delivery-media-params.js";
import { syncMediaParamsWithModalities } from "./delivery-display.js";
import { normalizeSegmentRole } from "./profile.js";

export function patchIntent(
  profile: WorkProfile | undefined,
  intent: Partial<ProfileIntentStep>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    intent: {
      summary:
        intent.summary !== undefined ? intent.summary : base.intent.summary,
    },
  };
}

export function patchDeliveryStep(
  profile: WorkProfile | undefined,
  delivery: Partial<ProfileDeliveryStep>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const nextFormat =
    delivery.format !== undefined ? delivery.format : base.delivery.format;
  const nextModalities =
    delivery.modalities !== undefined
      ? delivery.modalities
      : base.delivery.modalities;

  const mergedMediaParams =
    delivery.media_params !== undefined
      ? mergeDeliveryMediaParams(base.delivery.media_params, delivery.media_params)
      : delivery.format != null && delivery.format !== base.delivery.format
        ? defaultMediaParamsForFormat(delivery.format, nextModalities)
        : base.delivery.media_params;

  const media_params = syncMediaParamsWithModalities(
    nextModalities,
    mergedMediaParams,
  );

  return {
    ...base,
    delivery: {
      format: nextFormat,
      modalities: nextModalities,
      media_params,
    },
  };
}

export function patchExpression(
  profile: WorkProfile | undefined,
  expression: Partial<ProfileExpressionStep>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    expression: {
      audience:
        expression.audience !== undefined
          ? expression.audience
          : base.expression.audience,
      verbal:
        expression.verbal !== undefined
          ? expression.verbal
          : base.expression.verbal,
      visual:
        expression.visual !== undefined
          ? expression.visual
          : base.expression.visual,
    },
  };
}

export function updateDeliveryMediaParams(
  profile: WorkProfile | undefined,
  media_params: DeliveryMediaParams,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    delivery: {
      ...base.delivery,
      media_params: mergeDeliveryMediaParams(
        base.delivery.media_params,
        media_params,
      ),
    },
  };
}

export function updateConstraint(
  profile: WorkProfile | undefined,
  ruleId: string,
  description: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = description.trim();
  if (!trimmed) return base;
  return {
    ...base,
    constraints: {
      rules: base.constraints.rules.map((item) =>
        item.id === ruleId ? { ...item, description: trimmed } : item,
      ),
    },
  };
}

export function deleteConstraint(
  profile: WorkProfile | undefined,
  ruleId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    constraints: {
      rules: base.constraints.rules.filter((item) => item.id !== ruleId),
    },
  };
}

export function clearConstraints(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    constraints: { rules: [] },
  };
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
    structure: {
      ...base.structure,
      segments: base.structure.segments.map((item) =>
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
    structure: {
      ...base.structure,
      segments: base.structure.segments.filter((item) => item.id !== segmentId),
    },
  };
}

export function clearSegments(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    structure: { ...base.structure, segments: [] },
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
    structure: {
      ...base.structure,
      settings: base.structure.settings.map((item) =>
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
    structure: {
      ...base.structure,
      settings: base.structure.settings.filter((item) => item.id !== settingId),
    },
  };
}

export function clearSettings(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    structure: { ...base.structure, settings: [] },
  };
}

export type {
  ProfileConstraint,
  ProfileSegment,
  ProfileSetting,
};
