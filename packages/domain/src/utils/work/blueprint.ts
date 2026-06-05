import {
  EMPTY_BLUEPRINT_SPEC,
  EMPTY_BLUEPRINT_VOICE,
  EMPTY_WORK_BLUEPRINT,
  type BlueprintBeat,
  type BlueprintConstraint,
  type WorkBlueprint,
} from "../../models/work/blueprint.js";
import type { WorkBrief } from "../../models/work/brief.js";
import type { WorkOutline } from "../../models/work/outline.js";
import type { WorkProfile } from "../../models/work/profile.js";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function newBlueprintConstraint(description: string): BlueprintConstraint {
  return {
    id: newId("constraint"),
    description: description.trim(),
    confirmed_at: new Date().toISOString(),
  };
}

export function newBlueprintBeat(description: string, intent?: string | null): BlueprintBeat {
  return {
    id: newId("beat"),
    description: description.trim(),
    intent: intent?.trim() || null,
    confirmed_at: new Date().toISOString(),
  };
}

export function isBlueprintEmpty(blueprint: WorkBlueprint | undefined): boolean {
  if (!blueprint) return true;
  return (
    !blueprint.premise.trim() &&
    blueprint.constraints.length === 0 &&
    blueprint.beats.length === 0 &&
    !blueprint.spec.platform &&
    !blueprint.spec.content_topic
  );
}

export function hasBlueprintContent(blueprint: WorkBlueprint | undefined): boolean {
  if (!blueprint) return false;
  return blueprint.beats.length > 0 || Boolean(blueprint.premise.trim());
}

/** 是否具备开写条件（无 ready 字段，纯推导；不强制 platform） */
export function isBlueprintActionable(blueprint: WorkBlueprint | undefined): boolean {
  if (!blueprint) return false;
  return Boolean(
    blueprint.spec.content_topic?.trim() && blueprint.beats.length >= 1,
  );
}

export function getBlueprintPremise(blueprint: WorkBlueprint): string | null {
  const premise = blueprint.premise.trim();
  if (premise) return premise;
  if (blueprint.beats.length === 0) return null;
  return blueprint.beats.map((b) => b.description).join("；");
}

export function parseBlueprintJson(raw: unknown): WorkBlueprint {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_BLUEPRINT, spec: { ...EMPTY_BLUEPRINT_SPEC }, voice: { ...EMPTY_BLUEPRINT_VOICE } };
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
      media_modality:
        typeof specRaw.media_modality === "string" ? specRaw.media_modality : null,
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

/** 从旧 brief + outline + profile 物化列迁移 */
export function migrateLegacyToBlueprint(input: {
  brief?: WorkBrief;
  outline?: WorkOutline;
  profile?: WorkProfile;
}): WorkBlueprint {
  const blueprint = parseBlueprintJson(null);
  const profile = input.profile;
  const brief = input.brief;
  const outline = input.outline;

  if (profile) {
    blueprint.spec = {
      platform: profile.platform ?? null,
      content_topic: profile.content_topic ?? null,
      content_type: profile.content_type ?? null,
      content_format: profile.content_format ?? null,
      media_modality: profile.media_modality ?? null,
    };
    blueprint.voice = {
      audience: profile.audience ?? null,
      tone: profile.tone ?? null,
      style: profile.style ?? null,
      persona: profile.persona ?? null,
      goals: profile.goals ?? [],
    };
    if (profile.style_constraints?.length) {
      blueprint.constraints.push(
        ...profile.style_constraints.map((c) => newBlueprintConstraint(c)),
      );
    }
    if (profile.content_points?.length) {
      blueprint.constraints.push(
        ...profile.content_points.map((c) => newBlueprintConstraint(`要点：${c}`)),
      );
    }
    if (profile.notes?.trim()) {
      blueprint.constraints.push(newBlueprintConstraint(profile.notes.trim()));
    }
  }

  if (brief?.requirements.length) {
    blueprint.constraints.push(
      ...brief.requirements.map((r) => newBlueprintConstraint(r.description)),
    );
  }

  if (outline?.summary?.trim()) {
    blueprint.premise = outline.summary.trim();
  }

  if (outline?.sections.length) {
    blueprint.beats = outline.sections.map((s) =>
      newBlueprintBeat(s.description),
    );
  }

  return blueprint;
}

export function hasOutlineContent(blueprint: WorkBlueprint): boolean {
  return blueprint.beats.length > 0;
}

/** @deprecated 使用 hasBlueprintContent */
export const hasBriefContent = hasBlueprintContent;

export function resolveBlueprintFromWork(input: {
  blueprint?: unknown;
  brief?: WorkBrief;
  outline?: WorkOutline;
  profile?: WorkProfile;
}): WorkBlueprint {
  const parsed = parseBlueprintJson(input.blueprint);
  if (!isBlueprintEmpty(parsed)) return parsed;
  return migrateLegacyToBlueprint(input);
}
