import {
  EMPTY_WORK_PROFILE,
  type FormatParams,
  type GuardrailScope,
  type ProfileDelivery,
  type ProfileExpression,
  type ProfileGuardrail,
  type ProfileSegment,
  type SegmentRole,
  type WorkProfile,
} from "../../models/work/profile.js";
import { defaultParamsForFormat } from "../delivery.js";
import { newProfileGuardrail, newProfileSegment } from "./profile.js";

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

export type SegmentPatchInput = {
  description: string;
  role?: SegmentRole | string | null;
  title?: string | null;
};

export type GuardrailPatchInput = {
  description: string;
  scope?: GuardrailScope;
};

export type ProfilePatch = {
  delivery?: Partial<ProfileDelivery>;
  expression?: Partial<ProfileExpression>;
  summary?: string;
  params?: FormatParams;
  clear_segments?: boolean;
  segments_replace?: SegmentPatchInput[];
  segments_append?: SegmentPatchInput[];
  segment_updates?: Array<{
    segment_id: string;
    description: string;
    role?: SegmentRole | string | null;
    title?: string | null;
  }>;
  segment_deletes?: string[];
  clear_guardrails?: boolean;
  guardrails_replace?: GuardrailPatchInput[];
  guardrails_append?: GuardrailPatchInput[];
  guardrail_updates?: Array<{ guardrail_id: string; description: string }>;
  guardrail_deletes?: string[];
};

export type ApplyProfilePatchResult = {
  profile: WorkProfile;
  changes: string[];
  warnings: string[];
};

export function appendGuardrail(
  profile: WorkProfile,
  description: string,
  scope: GuardrailScope = "all",
): WorkProfile | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (profile.guardrails.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...profile,
    guardrails: [...profile.guardrails, newProfileGuardrail(trimmed, scope)],
  };
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

export function appendSegment(
  profile: WorkProfile,
  description: string,
  role?: SegmentRole | string | null,
  title?: string | null,
): WorkProfile | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (profile.blueprint.segments.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...profile,
    blueprint: {
      ...profile.blueprint,
      segments: [
        ...profile.blueprint.segments,
        newProfileSegment(trimmed, normalizeSegmentRole(role), title),
      ],
    },
  };
}

export function appendSegments(
  profile: WorkProfile,
  segments: SegmentPatchInput[],
): WorkProfile {
  let next = profile;
  for (const segment of segments) {
    const patched = appendSegment(
      next,
      segment.description,
      segment.role,
      segment.title,
    );
    if (patched) next = patched;
  }
  return next;
}

export function appendGuardrails(
  profile: WorkProfile,
  guardrails: GuardrailPatchInput[],
): WorkProfile {
  let next = profile;
  for (const guardrail of guardrails) {
    const patched = appendGuardrail(
      next,
      guardrail.description,
      guardrail.scope ?? "all",
    );
    if (patched) next = patched;
  }
  return next;
}

export function replaceGuardrails(
  profile: WorkProfile,
  guardrails: GuardrailPatchInput[],
): WorkProfile {
  return appendGuardrails(clearGuardrails(profile), guardrails);
}

export function replaceSegments(
  profile: WorkProfile,
  segments: SegmentPatchInput[],
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const nextSegments = segments
    .map((segment) => {
      const trimmed = segment.description.trim();
      if (!trimmed) return null;
      return newProfileSegment(
        trimmed,
        normalizeSegmentRole(segment.role),
        segment.title,
      );
    })
    .filter((segment): segment is ProfileSegment => segment != null);
  return {
    ...base,
    blueprint: { ...base.blueprint, segments: nextSegments },
  };
}

function hasExpressionPatch(expression: Partial<ProfileExpression>): boolean {
  if (expression.audience !== undefined) return true;
  if (expression.verbal && Object.values(expression.verbal).some((v) => v !== undefined)) {
    return true;
  }
  if (expression.visual && Object.values(expression.visual).some((v) => v !== undefined)) {
    return true;
  }
  return false;
}

function hasProfilePatchInput(patch: ProfilePatch): boolean {
  if (patch.delivery && Object.keys(patch.delivery).length > 0) return true;
  if (patch.expression && hasExpressionPatch(patch.expression)) return true;
  if (patch.summary?.trim()) return true;
  if (patch.params) return true;
  if (patch.clear_segments) return true;
  if (patch.segments_replace?.length) return true;
  if (patch.segments_append?.length) return true;
  if (patch.segment_updates?.length) return true;
  if (patch.segment_deletes?.length) return true;
  if (patch.clear_guardrails) return true;
  if (patch.guardrails_replace?.length) return true;
  if (patch.guardrails_append?.length) return true;
  if (patch.guardrail_updates?.length) return true;
  if (patch.guardrail_deletes?.length) return true;
  return false;
}

export function applyProfilePatch(
  profile: WorkProfile | undefined,
  patch: ProfilePatch,
): ApplyProfilePatchResult | null {
  if (!hasProfilePatchInput(patch)) return null;

  const changes: string[] = [];
  const warnings: string[] = [];
  let next = profile ?? EMPTY_WORK_PROFILE;

  if (patch.delivery && Object.keys(patch.delivery).length > 0) {
    next = patchDelivery(next, patch.delivery);
    changes.push("交付规格");
  }

  if (patch.expression && hasExpressionPatch(patch.expression)) {
    next = patchExpression(next, patch.expression);
    changes.push("表达设定");
  }

  if (patch.summary?.trim()) {
    next = setBlueprintSummary(next, patch.summary);
    changes.push("内容定位");
  }

  if (patch.params) {
    next = updateFormatParams(next, patch.params);
    changes.push("体裁参数");
  }

  if (patch.clear_guardrails) {
    next = clearGuardrails(next);
    changes.push("清空创作规则");
  }

  for (const guardrailId of patch.guardrail_deletes ?? []) {
    if (findGuardrailIndex(next, guardrailId) < 0) {
      warnings.push(`未找到规则 ${guardrailId}`);
      continue;
    }
    next = deleteGuardrail(next, guardrailId);
    if (!changes.includes("创作规则")) changes.push("创作规则");
  }

  for (const update of patch.guardrail_updates ?? []) {
    if (findGuardrailIndex(next, update.guardrail_id) < 0) {
      warnings.push(`未找到规则 ${update.guardrail_id}`);
      continue;
    }
    next = updateGuardrail(next, update.guardrail_id, update.description);
    if (!changes.includes("创作规则")) changes.push("创作规则");
  }

  if (patch.guardrails_replace?.length) {
    next = replaceGuardrails(next, patch.guardrails_replace);
    changes.push("创作规则");
  } else if (patch.guardrails_append?.length) {
    const before = next.guardrails.length;
    next = appendGuardrails(next, patch.guardrails_append);
    if (next.guardrails.length > before) {
      changes.push("创作规则");
    }
  }

  if (patch.clear_segments) {
    next = clearSegments(next);
    changes.push("清空结构段");
  }

  for (const segmentId of patch.segment_deletes ?? []) {
    if (findSegmentIndex(next, segmentId) < 0) {
      warnings.push(`未找到结构段 ${segmentId}`);
      continue;
    }
    next = deleteSegment(next, segmentId);
    if (!changes.includes("结构段")) changes.push("结构段");
  }

  for (const update of patch.segment_updates ?? []) {
    if (findSegmentIndex(next, update.segment_id) < 0) {
      warnings.push(`未找到结构段 ${update.segment_id}`);
      continue;
    }
    next = updateSegment(
      next,
      update.segment_id,
      update.description,
      update.role,
      update.title,
    );
    if (!changes.includes("结构段")) changes.push("结构段");
  }

  if (patch.segments_replace?.length) {
    next = replaceSegments(next, patch.segments_replace);
    changes.push("结构段");
  } else if (patch.segments_append?.length) {
    const before = next.blueprint.segments.length;
    next = appendSegments(next, patch.segments_append);
    if (next.blueprint.segments.length > before) {
      changes.push("结构段");
    }
  }

  if (!changes.length) return null;

  return { profile: next, changes, warnings };
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

export function findGuardrailIndex(
  profile: WorkProfile,
  guardrailId: string,
): number {
  return profile.guardrails.findIndex((item) => item.id === guardrailId);
}

export function findSegmentIndex(profile: WorkProfile, segmentId: string): number {
  return profile.blueprint.segments.findIndex((item) => item.id === segmentId);
}

export type { ProfileGuardrail, ProfileSegment };
