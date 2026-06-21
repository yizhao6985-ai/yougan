import {
  EMPTY_WORK_PROFILE,
  type ProfileDirection,
  type ProfileSpecItem,
  type ProfileStyle,
  type WorkProfile,
} from "../../models/work/profile.js";
import {
  newProfileRequirementItem,
  newProfileSpecItem,
  normalizeProfileTextField,
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
      verbal:
        style.verbal !== undefined
          ? normalizeProfileTextField(style.verbal)
          : base.style?.verbal,
      visual:
        style.visual !== undefined
          ? normalizeProfileTextField(style.visual)
          : base.style?.visual,
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

export function updateSettingItem(
  profile: WorkProfile | undefined,
  itemId: string,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    setting: updateSpecItem(base.setting, itemId, spec),
  };
}

export function deleteSettingItem(
  profile: WorkProfile | undefined,
  itemId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    setting: deleteSpecItem(base.setting, itemId),
  };
}

export function clearSetting(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, setting: [] };
}

export function updateRequirementItem(
  profile: WorkProfile | undefined,
  itemId: string,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    requirements: updateSpecItem(base.requirements, itemId, spec),
  };
}

export function deleteRequirementItem(
  profile: WorkProfile | undefined,
  itemId: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return {
    ...base,
    requirements: deleteSpecItem(base.requirements, itemId),
  };
}

export function clearRequirements(profile: WorkProfile | undefined): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  return { ...base, requirements: [] };
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

export function appendSetting(
  profile: WorkProfile | undefined,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = spec.trim();
  if (!trimmed) return base;
  if (base.setting.some((item) => item.spec === trimmed)) return base;
  return {
    ...base,
    setting: [...base.setting, newProfileSpecItem(trimmed, "set")],
  };
}

export function appendRequirement(
  profile: WorkProfile | undefined,
  spec: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const trimmed = spec.trim();
  if (!trimmed) return base;
  if (base.requirements.some((item) => item.spec === trimmed)) return base;
  return {
    ...base,
    requirements: [...base.requirements, newProfileRequirementItem(trimmed)],
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

export type { ProfileSpecItem };
