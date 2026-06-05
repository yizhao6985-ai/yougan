import {
  EMPTY_WORK_BLUEPRINT,
  type BlueprintBeat,
  type BlueprintConstraint,
  type BlueprintSpec,
  type BlueprintVoice,
  type WorkBlueprint,
} from "../../models/work/blueprint.js";
import {
  newBlueprintBeat,
  newBlueprintConstraint,
} from "./blueprint.js";

export function patchBlueprintSpec(
  blueprint: WorkBlueprint | undefined,
  spec: Partial<BlueprintSpec>,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  return {
    ...base,
    spec: { ...base.spec, ...spec },
  };
}

export function patchBlueprintVoice(
  blueprint: WorkBlueprint | undefined,
  voice: Partial<BlueprintVoice>,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  return {
    ...base,
    voice: { ...base.voice, ...voice },
  };
}

export function setBlueprintPremise(
  blueprint: WorkBlueprint | undefined,
  premise: string,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  return { ...base, premise: premise.trim() };
}

export function appendBlueprintConstraint(
  blueprint: WorkBlueprint,
  description: string,
): WorkBlueprint | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (blueprint.constraints.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...blueprint,
    constraints: [...blueprint.constraints, newBlueprintConstraint(trimmed)],
  };
}

export function updateBlueprintConstraint(
  blueprint: WorkBlueprint | undefined,
  constraintId: string,
  description: string,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  const trimmed = description.trim();
  if (!trimmed) return base;
  return {
    ...base,
    constraints: base.constraints.map((item) =>
      item.id === constraintId ? { ...item, description: trimmed } : item,
    ),
  };
}

export function deleteBlueprintConstraint(
  blueprint: WorkBlueprint | undefined,
  constraintId: string,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  return {
    ...base,
    constraints: base.constraints.filter((item) => item.id !== constraintId),
  };
}

export function clearBlueprintConstraints(
  blueprint: WorkBlueprint | undefined,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  return { ...base, constraints: [] };
}

export function appendBlueprintBeat(
  blueprint: WorkBlueprint,
  description: string,
  intent?: string | null,
): WorkBlueprint | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (blueprint.beats.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...blueprint,
    beats: [...blueprint.beats, newBlueprintBeat(trimmed, intent)],
  };
}

export function updateBlueprintBeat(
  blueprint: WorkBlueprint | undefined,
  beatId: string,
  description: string,
  intent?: string | null,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
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

export function deleteBlueprintBeat(
  blueprint: WorkBlueprint | undefined,
  beatId: string,
): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  return {
    ...base,
    beats: base.beats.filter((item) => item.id !== beatId),
  };
}

export function clearBlueprintBeats(blueprint: WorkBlueprint | undefined): WorkBlueprint {
  const base = blueprint ?? EMPTY_WORK_BLUEPRINT;
  return { ...base, beats: [] };
}

export function findBlueprintConstraintIndex(
  blueprint: WorkBlueprint,
  constraintId: string,
): number {
  return blueprint.constraints.findIndex((item) => item.id === constraintId);
}

export function findBlueprintBeatIndex(
  blueprint: WorkBlueprint,
  beatId: string,
): number {
  return blueprint.beats.findIndex((item) => item.id === beatId);
}

export type { BlueprintBeat, BlueprintConstraint };
