import {
  EMPTY_WORK_PROFILE,
  type ProfileBeat,
  type ProfileConstraint,
  type ProfileSpec,
  type ProfileVoice,
  type WorkProfile,
} from "../../models/work/profile.js";
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

export type { ProfileBeat, ProfileConstraint };
