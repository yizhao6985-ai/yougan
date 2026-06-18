import {
  appendBound,
  appendContext,
  appendSequence,
  clearBounds,
  clearContext,
  clearSequence,
  newProfileSequenceItem,
  newProfileSpecItem,
  normalizeSequenceRole,
  patchDirection,
  patchStyle,
  type ProfileDirection,
  type ProfileStyle,
  type SequenceRole,
  type WorkProfile,
  EMPTY_WORK_PROFILE,
} from "@yougan/domain";

export type SequencePatchInput = {
  spec: string;
  role?: SequenceRole | string | null;
};

export type SpecPatchInput = {
  spec: string;
};

export type ProfilePatch = {
  direction?: Partial<ProfileDirection>;
  style?: Partial<ProfileStyle>;
  clear_context?: boolean;
  context_replace?: SpecPatchInput[];
  context_append?: SpecPatchInput[];
  clear_sequence?: boolean;
  sequence_replace?: SequencePatchInput[];
  sequence_append?: SequencePatchInput[];
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

  if (prefix === "ctx") {
    return { ...base, context: next };
  }
  return { ...base, bounds: next };
}

function replaceSequence(
  profile: WorkProfile,
  items: SequencePatchInput[],
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const next = items
    .map((item) => {
      const trimmed = item.spec.trim();
      if (!trimmed) return null;
      return newProfileSequenceItem(trimmed, normalizeSequenceRole(item.role));
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
  return { ...base, sequence: next };
}

function hasStylePatch(style: Partial<ProfileStyle>): boolean {
  return style.verbal !== undefined || style.visual !== undefined;
}

function hasProfilePatchInput(patch: ProfilePatch): boolean {
  if (patch.direction && Object.keys(patch.direction).length > 0) return true;
  if (patch.style && hasStylePatch(patch.style)) return true;
  if (patch.clear_context) return true;
  if (patch.context_replace?.length) return true;
  if (patch.context_append?.length) return true;
  if (patch.clear_sequence) return true;
  if (patch.sequence_replace?.length) return true;
  if (patch.sequence_append?.length) return true;
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

  if (patch.clear_context) {
    next = clearContext(next);
    changes.push("清空背景");
  }
  if (patch.context_replace?.length) {
    next = replaceSpecs(next, patch.context_replace, "ctx");
    changes.push("背景");
  } else if (patch.context_append?.length) {
    const before = next.context.length;
    next = appendSpecs(next, patch.context_append, appendContext);
    if (next.context.length > before) changes.push("背景");
  }

  if (patch.clear_sequence) {
    next = clearSequence(next);
    changes.push("清空节拍");
  }
  if (patch.sequence_replace?.length) {
    next = replaceSequence(next, patch.sequence_replace);
    changes.push("节拍");
  } else if (patch.sequence_append?.length) {
    const before = next.sequence.length;
    for (const item of patch.sequence_append) {
      next = appendSequence(next, item.spec, item.role);
    }
    if (next.sequence.length > before) changes.push("节拍");
  }

  if (patch.clear_bounds) {
    next = clearBounds(next);
    changes.push("清空边界");
  }
  if (patch.bounds_replace?.length) {
    next = replaceSpecs(next, patch.bounds_replace, "bnd");
    changes.push("边界");
  } else if (patch.bounds_append?.length) {
    const before = next.bounds.length;
    next = appendSpecs(next, patch.bounds_append, appendBound);
    if (next.bounds.length > before) changes.push("边界");
  }

  if (!changes.length) return null;

  return { profile: next, changes };
}
