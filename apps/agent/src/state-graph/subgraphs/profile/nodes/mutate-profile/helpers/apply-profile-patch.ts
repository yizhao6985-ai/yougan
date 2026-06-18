import {
  clearConstraints,
  clearSegments,
  clearSettings,
  newProfileConstraint,
  newProfileSegment,
  newProfileSetting,
  normalizeSegmentRole,
  patchDeliveryStep,
  patchExpression,
  patchIntent,
  type ConstraintScope,
  type ProfileConstraint,
  type ProfileDeliveryStep,
  type ProfileExpressionStep,
  type ProfileIntentStep,
  type ProfileSegment,
  type ProfileSetting,
  type ProfileSettingKind,
  type SegmentRole,
  type WorkProfile,
  EMPTY_WORK_PROFILE,
} from "@yougan/domain";

export type SegmentPatchInput = {
  description: string;
  role?: SegmentRole | string | null;
  title?: string | null;
};

export type ConstraintPatchInput = {
  description: string;
  scope?: ConstraintScope;
};

export type SettingPatchInput = {
  description: string;
  kind?: ProfileSettingKind | string;
  title?: string | null;
};

export type ProfilePatch = {
  intent?: Partial<ProfileIntentStep>;
  delivery?: Partial<ProfileDeliveryStep>;
  expression?: Partial<ProfileExpressionStep>;
  clear_settings?: boolean;
  settings_replace?: SettingPatchInput[];
  settings_append?: SettingPatchInput[];
  clear_segments?: boolean;
  segments_replace?: SegmentPatchInput[];
  segments_append?: SegmentPatchInput[];
  clear_rules?: boolean;
  rules_replace?: ConstraintPatchInput[];
  rules_append?: ConstraintPatchInput[];
};

export type ApplyProfilePatchResult = {
  profile: WorkProfile;
  changes: string[];
};

const VALID_SETTING_KINDS: ProfileSettingKind[] = [
  "character",
  "world",
  "other",
];

function normalizeSettingKind(
  kind?: ProfileSettingKind | string | null,
): ProfileSettingKind {
  if (kind && VALID_SETTING_KINDS.includes(kind as ProfileSettingKind)) {
    return kind as ProfileSettingKind;
  }
  return "other";
}

function appendRule(
  profile: WorkProfile,
  description: string,
  scope: ConstraintScope = "all",
): WorkProfile | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (
    profile.constraints.rules.some(
      (item) => item.description.trim() === trimmed,
    )
  ) {
    return null;
  }
  return {
    ...profile,
    constraints: {
      rules: [
        ...profile.constraints.rules,
        newProfileConstraint(trimmed, scope),
      ],
    },
  };
}

function appendSegment(
  profile: WorkProfile,
  description: string,
  role?: SegmentRole | string | null,
  title?: string | null,
): WorkProfile | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (
    profile.structure.segments.some(
      (item) => item.description.trim() === trimmed,
    )
  ) {
    return null;
  }
  return {
    ...profile,
    structure: {
      ...profile.structure,
      segments: [
        ...profile.structure.segments,
        newProfileSegment(trimmed, normalizeSegmentRole(role), title),
      ],
    },
  };
}

function appendSegments(
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

function appendSetting(
  profile: WorkProfile,
  description: string,
  kind?: ProfileSettingKind | string,
  title?: string | null,
): WorkProfile | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (
    profile.structure.settings.some(
      (item) =>
        item.description.trim() === trimmed &&
        item.kind === normalizeSettingKind(kind) &&
        (item.title?.trim() || null) === (title?.trim() || null),
    )
  ) {
    return null;
  }
  return {
    ...profile,
    structure: {
      ...profile.structure,
      settings: [
        ...profile.structure.settings,
        newProfileSetting(trimmed, kind, title),
      ],
    },
  };
}

function appendSettings(
  profile: WorkProfile,
  settings: SettingPatchInput[],
): WorkProfile {
  let next = profile;
  for (const setting of settings) {
    const patched = appendSetting(
      next,
      setting.description,
      setting.kind,
      setting.title,
    );
    if (patched) next = patched;
  }
  return next;
}

function replaceSettings(
  profile: WorkProfile,
  settings: SettingPatchInput[],
): WorkProfile {
  const base = profile ?? EMPTY_WORK_PROFILE;
  const nextSettings = settings
    .map((setting) => {
      const trimmed = setting.description.trim();
      if (!trimmed) return null;
      return newProfileSetting(trimmed, setting.kind, setting.title);
    })
    .filter((setting): setting is ProfileSetting => setting != null);
  return {
    ...base,
    structure: { ...base.structure, settings: nextSettings },
  };
}

function appendRules(
  profile: WorkProfile,
  rules: ConstraintPatchInput[],
): WorkProfile {
  let next = profile;
  for (const rule of rules) {
    const patched = appendRule(next, rule.description, rule.scope ?? "all");
    if (patched) next = patched;
  }
  return next;
}

function replaceRules(
  profile: WorkProfile,
  rules: ConstraintPatchInput[],
): WorkProfile {
  return appendRules(clearConstraints(profile), rules);
}

function replaceSegments(
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
    structure: { ...base.structure, segments: nextSegments },
  };
}

function hasExpressionPatch(
  expression: Partial<ProfileExpressionStep>,
): boolean {
  if (expression.audience !== undefined) return true;
  if (expression.verbal !== undefined) return true;
  if (expression.visual !== undefined) return true;
  return false;
}

function hasProfilePatchInput(patch: ProfilePatch): boolean {
  if (patch.intent && Object.keys(patch.intent).length > 0) return true;
  if (patch.delivery && Object.keys(patch.delivery).length > 0) return true;
  if (patch.expression && hasExpressionPatch(patch.expression)) return true;
  if (patch.clear_settings) return true;
  if (patch.settings_replace?.length) return true;
  if (patch.settings_append?.length) return true;
  if (patch.clear_segments) return true;
  if (patch.segments_replace?.length) return true;
  if (patch.segments_append?.length) return true;
  if (patch.clear_rules) return true;
  if (patch.rules_replace?.length) return true;
  if (patch.rules_append?.length) return true;
  return false;
}

export function applyProfilePatch(
  profile: WorkProfile | undefined,
  patch: ProfilePatch,
): ApplyProfilePatchResult | null {
  if (!hasProfilePatchInput(patch)) return null;

  const changes: string[] = [];
  let next = profile ?? EMPTY_WORK_PROFILE;

  if (patch.intent && Object.keys(patch.intent).length > 0) {
    next = patchIntent(next, patch.intent);
    changes.push("创作定位");
  }

  if (patch.delivery && Object.keys(patch.delivery).length > 0) {
    next = patchDeliveryStep(next, patch.delivery);
    changes.push("内容形态与规格");
  }

  if (patch.expression && hasExpressionPatch(patch.expression)) {
    next = patchExpression(next, patch.expression);
    changes.push("表达设定");
  }

  if (patch.clear_rules) {
    next = clearConstraints(next);
    changes.push("清空创作规则");
  }

  if (patch.rules_replace?.length) {
    next = replaceRules(next, patch.rules_replace);
    changes.push("创作规则");
  } else if (patch.rules_append?.length) {
    const before = next.constraints.rules.length;
    next = appendRules(next, patch.rules_append);
    if (next.constraints.rules.length > before) {
      changes.push("创作规则");
    }
  }

  if (patch.clear_segments) {
    next = clearSegments(next);
    changes.push("清空结构段");
  }

  if (patch.clear_settings) {
    next = clearSettings(next);
    changes.push("清空创作设定");
  }

  if (patch.settings_replace?.length) {
    next = replaceSettings(next, patch.settings_replace);
    changes.push("创作设定");
  } else if (patch.settings_append?.length) {
    const before = next.structure.settings.length;
    next = appendSettings(next, patch.settings_append);
    if (next.structure.settings.length > before) {
      changes.push("创作设定");
    }
  }

  if (patch.segments_replace?.length) {
    next = replaceSegments(next, patch.segments_replace);
    changes.push("结构段");
  } else if (patch.segments_append?.length) {
    const before = next.structure.segments.length;
    next = appendSegments(next, patch.segments_append);
    if (next.structure.segments.length > before) {
      changes.push("结构段");
    }
  }

  if (!changes.length) return null;

  return { profile: next, changes };
}
