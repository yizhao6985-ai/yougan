import {
  appendBound,
  appendRequirement,
  appendSetting,
  clearBounds,
  clearRequirements,
  clearSetting,
  newProfileSpecItem,
  patchDirection,
  patchStyle,
  type ProfileDirection,
  type ProfileStyle,
  type WorkProfile,
  EMPTY_WORK_PROFILE,
} from "@yougan/domain";

export type SpecPatchInput = {
  spec: string;
};

export type ProfilePatch = {
  direction?: Partial<ProfileDirection>;
  style?: Partial<ProfileStyle>;
  clear_setting?: boolean;
  setting_replace?: SpecPatchInput[];
  setting_append?: SpecPatchInput[];
  clear_requirements?: boolean;
  requirements_replace?: SpecPatchInput[];
  requirements_append?: SpecPatchInput[];
  clear_bounds?: boolean;
  bounds_replace?: SpecPatchInput[];
  bounds_append?: SpecPatchInput[];
};

export type ApplyProfilePatchResult = {
  profile: WorkProfile;
  changes: string[];
};

function appendSpecs(
  profile: WorkProfile,
  items: SpecPatchInput[],
  append: (profile: WorkProfile, spec: string) => WorkProfile,
): WorkProfile {
  let next = profile;
  for (const item of items) {
    next = append(next, item.spec);
  }
  return next;
}

function replaceSpecs(
  profile: WorkProfile,
  items: SpecPatchInput[],
  field: "setting" | "requirements" | "bounds",
  prefix: string,
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const next = items
    .map((item) => {
      const trimmed = item.spec.trim();
      if (!trimmed) return null;
      return newProfileSpecItem(trimmed, prefix);
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  return { ...base, [field]: next };
}

function hasStylePatch(style: Partial<ProfileStyle>): boolean {
  return style.verbal !== undefined || style.visual !== undefined;
}

function hasProfilePatchInput(patch: ProfilePatch): boolean {
  if (patch.direction && Object.keys(patch.direction).length > 0) return true;
  if (patch.style && hasStylePatch(patch.style)) return true;
  if (patch.clear_setting) return true;
  if (patch.setting_replace?.length) return true;
  if (patch.setting_append?.length) return true;
  if (patch.clear_requirements) return true;
  if (patch.requirements_replace?.length) return true;
  if (patch.requirements_append?.length) return true;
  if (patch.clear_bounds) return true;
  if (patch.bounds_replace?.length) return true;
  if (patch.bounds_append?.length) return true;
  return false;
}

export function applyProfilePatch(
  profile: WorkProfile | undefined,
  patch: ProfilePatch,
): ApplyProfilePatchResult | null {
  if (!hasProfilePatchInput(patch)) return null;

  const changes: string[] = [];
  let next = profile ?? EMPTY_WORK_PROFILE;

  if (patch.direction && Object.keys(patch.direction).length > 0) {
    next = patchDirection(next, patch.direction);
    changes.push("方向");
  }

  if (patch.style && hasStylePatch(patch.style)) {
    next = patchStyle(next, patch.style);
    changes.push("风格");
  }

  if (patch.clear_setting) {
    next = clearSetting(next);
    changes.push("清空背景");
  }
  if (patch.setting_replace?.length) {
    next = replaceSpecs(next, patch.setting_replace, "setting", "set");
    changes.push("背景");
  } else if (patch.setting_append?.length) {
    const before = next.setting.length;
    next = appendSpecs(next, patch.setting_append, appendSetting);
    if (next.setting.length > before) changes.push("背景");
  }

  if (patch.clear_requirements) {
    next = clearRequirements(next);
    changes.push("清空需求");
  }
  if (patch.requirements_replace?.length) {
    next = replaceSpecs(next, patch.requirements_replace, "requirements", "req");
    changes.push("需求");
  } else if (patch.requirements_append?.length) {
    const before = next.requirements.length;
    next = appendSpecs(next, patch.requirements_append, appendRequirement);
    if (next.requirements.length > before) changes.push("需求");
  }

  if (patch.clear_bounds) {
    next = clearBounds(next);
    changes.push("清空边界");
  }
  if (patch.bounds_replace?.length) {
    next = replaceSpecs(next, patch.bounds_replace, "bounds", "bnd");
    changes.push("边界");
  } else if (patch.bounds_append?.length) {
    const before = next.bounds.length;
    next = appendSpecs(next, patch.bounds_append, appendBound);
    if (next.bounds.length > before) changes.push("边界");
  }

  if (!changes.length) return null;

  return { profile: next, changes };
}
