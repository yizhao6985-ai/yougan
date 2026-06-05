import {
  EMPTY_WORK_PROFILE,
  type ProfileBeat,
  type ProfileConstraint,
  type ProfileSpec,
  type ProfileVoice,
  type WorkProfile,
} from "../../models/work/profile.js";
import type { ReferenceItem } from "../../models/work/reference.js";
import { newProfileBeat, newProfileConstraint } from "./profile.js";

export function patchProfileSpec(
  profile: WorkProfile | undefined,
  spec: Partial<ProfileSpec>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    spec: { ...base.spec, ...spec },
  };
}

export function patchProfileVoice(
  profile: WorkProfile | undefined,
  voice: Partial<ProfileVoice>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    voice: { ...base.voice, ...voice },
  };
}

export function setProfilePremise(
  profile: WorkProfile | undefined,
  premise: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, premise: premise.trim() };
}

export function appendProfileConstraint(
  profile: WorkProfile,
  description: string,
): WorkProfile | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (profile.constraints.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...profile,
    constraints: [...profile.constraints, newProfileConstraint(trimmed)],
  };
}

export function updateProfileConstraint(
  profile: WorkProfile | undefined,
  constraintId: string,
  description: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = description.trim();
  if (!trimmed) return base;
  return {
    ...base,
    constraints: base.constraints.map((item) =>
      item.id === constraintId ? { ...item, description: trimmed } : item,
    ),
  };
}

export function deleteProfileConstraint(
  profile: WorkProfile | undefined,
  constraintId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    constraints: base.constraints.filter((item) => item.id !== constraintId),
  };
}

export function clearProfileConstraints(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, constraints: [] };
}

export function appendProfileBeat(
  profile: WorkProfile,
  description: string,
  intent?: string | null,
): WorkProfile | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (profile.beats.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...profile,
    beats: [...profile.beats, newProfileBeat(trimmed, intent)],
  };
}

/** 按顺序批量追加节拍（跳过空描述与重复描述） */
export function appendProfileBeats(
  profile: WorkProfile,
  beats: Array<{ description: string; intent?: string | null }>,
): WorkProfile {
  let next = profile;
  for (const beat of beats) {
    const patched = appendProfileBeat(next, beat.description, beat.intent);
    if (patched) next = patched;
  }
  return next;
}

export function updateProfileBeat(
  profile: WorkProfile | undefined,
  beatId: string,
  description: string,
  intent?: string | null,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = description.trim();
  if (!trimmed) return base;
  return {
    ...base,
    beats: base.beats.map((item) =>
      item.id === beatId
        ? {
            ...item,
            description: trimmed,
            intent: intent === undefined ? item.intent : intent?.trim() || null,
          }
        : item,
    ),
  };
}

export function deleteProfileBeat(
  profile: WorkProfile | undefined,
  beatId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    beats: base.beats.filter((item) => item.id !== beatId),
  };
}

export function clearProfileBeats(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, beats: [] };
}

export function findProfileConstraintIndex(
  profile: WorkProfile,
  constraintId: string,
): number {
  return profile.constraints.findIndex((item) => item.id === constraintId);
}

export function findProfileBeatIndex(profile: WorkProfile, beatId: string): number {
  return profile.beats.findIndex((item) => item.id === beatId);
}

/** 按 image_url 或列表下标删除一条参考素材 */
export function deleteProfileReference(
  profile: WorkProfile,
  target: { image_url?: string; index?: number },
): WorkProfile | null {
  const { image_url, index } = target;
  const refs = profile.references ?? [];
  if (!refs.length) return null;

  let removeAt = -1;
  if (typeof index === "number" && index >= 0 && index < refs.length) {
    removeAt = index;
  } else if (image_url?.trim()) {
    const url = image_url.trim();
    removeAt = refs.findIndex(
      (item) => item.source_type === "image" && item.image_url === url,
    );
  }
  if (removeAt < 0) return null;

  const nextRefs = refs.filter((_, i) => i !== removeAt);
  return { ...profile, references: nextRefs };
}

export type { ProfileBeat, ProfileConstraint, ReferenceItem };
