import {
  EMPTY_WORK_PROFILE,
  type ProfileDirection,
  type ProfileSequenceItem,
  type ProfileSpecItem,
  type ProfileStyle,
  type SequenceRole,
  type WorkProfile,
} from "../../models/work/profile.js";
import {
  newProfileSequenceItem,
  newProfileSpecItem,
  normalizeSequenceRole,
} from "./profile.js";

export function patchDirection(
  profile: WorkProfile | undefined,
  direction: Partial<ProfileDirection>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    direction: {
      summary:
        direction.summary !== undefined
          ? direction.summary
          : base.direction.summary,
      format:
        direction.format !== undefined
          ? direction.format
          : base.direction.format,
      audience:
        direction.audience !== undefined
          ? direction.audience
          : base.direction.audience,
    },
  };
}

export function patchStyle(
  profile: WorkProfile | undefined,
  style: Partial<ProfileStyle>,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    style: {
      verbal: style.verbal !== undefined ? style.verbal : base.style?.verbal,
      visual: style.visual !== undefined ? style.visual : base.style?.visual,
    },
  };
}

function updateSpecItem(
  items: ProfileSpecItem[],
  itemId: string,
  spec: string,
): ProfileSpecItem[] {
  const trimmed = spec.trim();
  if (!trimmed) return items;
  return items.map((item) =>
    item.id === itemId ? { ...item, spec: trimmed } : item,
  );
}

function deleteSpecItem(items: ProfileSpecItem[], itemId: string): ProfileSpecItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function updateContextItem(
  profile: WorkProfile | undefined,
  itemId: string,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    context: updateSpecItem(base.context, itemId, spec),
  };
}

export function deleteContextItem(
  profile: WorkProfile | undefined,
  itemId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    context: deleteSpecItem(base.context, itemId),
  };
}

export function clearContext(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, context: [] };
}

export function updateBoundItem(
  profile: WorkProfile | undefined,
  itemId: string,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    bounds: updateSpecItem(base.bounds, itemId, spec),
  };
}

export function deleteBoundItem(
  profile: WorkProfile | undefined,
  itemId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    bounds: deleteSpecItem(base.bounds, itemId),
  };
}

export function clearBounds(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, bounds: [] };
}

export function updateSequenceItem(
  profile: WorkProfile | undefined,
  itemId: string,
  spec: string,
  role?: SequenceRole | string | null,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = spec.trim();
  if (!trimmed) return base;
  return {
    ...base,
    sequence: base.sequence.map((item) =>
      item.id === itemId
        ? {
            ...item,
            spec: trimmed,
            role: role === undefined ? item.role : normalizeSequenceRole(role),
          }
        : item,
    ),
  };
}

export function deleteSequenceItem(
  profile: WorkProfile | undefined,
  itemId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    sequence: base.sequence.filter((item) => item.id !== itemId),
  };
}

export function clearSequence(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, sequence: [] };
}

export function appendContext(
  profile: WorkProfile | undefined,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = spec.trim();
  if (!trimmed) return base;
  if (base.context.some((item) => item.spec === trimmed)) return base;
  return {
    ...base,
    context: [...base.context, newProfileSpecItem(trimmed, "ctx")],
  };
}

export function appendBound(
  profile: WorkProfile | undefined,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = spec.trim();
  if (!trimmed) return base;
  if (base.bounds.some((item) => item.spec === trimmed)) return base;
  return {
    ...base,
    bounds: [...base.bounds, newProfileSpecItem(trimmed, "bnd")],
  };
}

export function appendSequence(
  profile: WorkProfile | undefined,
  spec: string,
  role?: SequenceRole | string | null,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = spec.trim();
  if (!trimmed) return base;
  if (base.sequence.some((item) => item.spec === trimmed)) return base;
  return {
    ...base,
    sequence: [...base.sequence, newProfileSequenceItem(trimmed, role)],
  };
}

export type { ProfileSequenceItem, ProfileSpecItem };
