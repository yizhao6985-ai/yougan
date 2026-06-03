import {
  EMPTY_WORK_BRIEF,
  type BriefRequirement,
  type WorkBrief,
} from "../../models/work/brief.js";
import { newBriefRequirement } from "./brief.js";

export function updateBriefRequirement(
  brief: WorkBrief | undefined,
  requirementId: string,
  description: string,
): WorkBrief {
  const base = brief ?? EMPTY_WORK_BRIEF;
  const trimmed = description.trim();
  if (!trimmed) return base;

  const nextRequirements = base.requirements.map((item) =>
    item.id === requirementId ? { ...item, description: trimmed } : item,
  );
  if (
    nextRequirements.every(
      (item, index) =>
        item.description === base.requirements[index]?.description,
    )
  ) {
    return base;
  }

  return { ...base, requirements: nextRequirements };
}

export function deleteBriefRequirement(
  brief: WorkBrief | undefined,
  requirementId: string,
): WorkBrief {
  const base = brief ?? EMPTY_WORK_BRIEF;
  const nextRequirements = base.requirements.filter(
    (item) => item.id !== requirementId,
  );
  if (nextRequirements.length === base.requirements.length) return base;

  return { ...base, requirements: nextRequirements };
}

export function clearBrief(_brief: WorkBrief | undefined): WorkBrief {
  return { requirements: [] };
}

/** 追加一条需求；描述为空或重复时返回 null */
export function appendBriefRequirement(
  brief: WorkBrief,
  description: string,
): WorkBrief | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (brief.requirements.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...brief,
    requirements: [...brief.requirements, newBriefRequirement(trimmed)],
  };
}

export type { BriefRequirement };
