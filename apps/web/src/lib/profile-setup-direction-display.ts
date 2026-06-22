import {
  getProfileStepCopy,
  parseProfileJson,
  resolveProfileSetupDirectionRoles,
  splitProfileSetupSuggestionLayers,
  type TurnDirection,
  type ProfileStepId,
  type WorkProfile,
} from "@yougan/domain";

export type ProfileSetupDirectionGroup = {
  step: ProfileStepId | "ready" | "_ungrouped" | "_consolidate" | "_advance";
  title: string;
  directions: TurnDirection[];
};

function buildStepTitle(
  profile: WorkProfile,
  step: ProfileStepId | "ready",
  prefix: string,
): string {
  return `${prefix} · ${getProfileStepCopy(profile, step).title}`;
}

function buildAdvanceTitle(
  profile: WorkProfile,
  advance: TurnDirection[],
): string {
  const advanceStep = advance[0]?.step;
  if (advanceStep === "ready") {
    return "开始制作";
  }
  if (advanceStep) {
    return buildStepTitle(profile, advanceStep, "下一步");
  }
  return "下一步";
}

function buildLayeredGroups(
  parsed: WorkProfile,
  consolidate: TurnDirection[],
  advance: TurnDirection[],
): ProfileSetupDirectionGroup[] {
  const result: ProfileSetupDirectionGroup[] = [];
  const consolidateStep = consolidate[0]?.step;

  if (consolidate.length > 0) {
    result.push({
      step: "_consolidate",
      title:
        consolidateStep && consolidateStep !== "ready"
          ? buildStepTitle(parsed, consolidateStep, "扩展当前状态")
          : "扩展当前状态",
      directions: consolidate,
    });
  }

  if (advance.length > 0) {
    result.push({
      step: "_advance",
      title: buildAdvanceTitle(parsed, advance),
      directions: advance,
    });
  }

  return result;
}

export function groupProfileSetupDirections(
  directions: TurnDirection[],
  profile?: WorkProfile,
): ProfileSetupDirectionGroup[] {
  const parsed = parseProfileJson(profile);
  const normalized = resolveProfileSetupDirectionRoles(directions, {
    profile: parsed,
  });
  const layered = splitProfileSetupSuggestionLayers(normalized, {
    profile: parsed,
  });

  if (layered) {
    const assignedIds = new Set(
      [...layered.consolidate, ...layered.advance].map((item) => item.id),
    );
    const result = buildLayeredGroups(
      parsed,
      layered.consolidate,
      layered.advance,
    );
    const rest = normalized.filter((item) => !assignedIds.has(item.id));
    if (rest.length > 0) {
      result.push({ step: "_ungrouped", title: "", directions: rest });
    }
    return result.length > 0
      ? result
      : [{ step: "_ungrouped", title: "", directions: normalized }];
  }

  const consolidate = normalized.filter((item) => item.role === "refine");
  const advance = normalized.filter((item) => item.role === "navigate");
  const hasLayeredRoles = consolidate.length > 0 && advance.length > 0;

  if (hasLayeredRoles) {
    const result = buildLayeredGroups(parsed, consolidate, advance);
    const rest = normalized.filter(
      (item) => item.role !== "refine" && item.role !== "navigate",
    );
    if (rest.length > 0) {
      result.push({ step: "_ungrouped", title: "", directions: rest });
    }
    return result;
  }

  const withStep = normalized.filter((item) => item.step);
  if (withStep.length === 0) {
    return [{ step: "_ungrouped", title: "", directions: normalized }];
  }

  const order: Array<ProfileStepId | "ready"> = [
    "direction",
    "style",
    "setting",
    "requirements",
    "bounds",
    "ready",
  ];
  const groups = new Map<ProfileStepId | "ready", TurnDirection[]>();

  for (const item of normalized) {
    if (!item.step) continue;
    const list = groups.get(item.step) ?? [];
    list.push(item);
    groups.set(item.step, list);
  }

  const ungrouped = normalized.filter((item) => !item.step);
  const result: ProfileSetupDirectionGroup[] = [];

  for (const step of order) {
    const items = groups.get(step);
    if (!items?.length) continue;
    const copy = getProfileStepCopy(parsed, step);
    const hasRefine = items.some((item) => item.role === "refine");
    const hasNavigate = items.some((item) => item.role === "navigate");
    const title = hasNavigate
      ? step === "ready"
        ? "开始制作"
        : buildStepTitle(parsed, step, "下一步")
      : hasRefine
        ? `扩展当前状态 · ${copy.title}`
        : `补充${copy.title}`;
    result.push({ step, title, directions: items });
  }

  if (ungrouped.length > 0) {
    result.push({ step: "_ungrouped", title: "", directions: ungrouped });
  }

  return result.length > 0
    ? result
    : [{ step: "_ungrouped", title: "", directions: normalized }];
}
