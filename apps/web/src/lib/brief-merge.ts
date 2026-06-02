import { mergeBriefState } from "@yougan/domain";
import type { BriefRequirement, WorkBrief } from "@/lib/types";
import { EMPTY_WORK_BRIEF } from "@/lib/types";

export { mergeBriefState };

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
      (item, index) => item.description === base.requirements[index]?.description,
    )
  ) {
    return base;
  }

  return {
    ...base,
    requirements: nextRequirements,
  };
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

  return {
    ...base,
    requirements: nextRequirements,
  };
}

export function clearBrief(_brief: WorkBrief | undefined): WorkBrief {
  return { requirements: [] };
}

export function mergeBriefForDisplay(
  cached?: WorkBrief,
  streamed?: WorkBrief,
): WorkBrief | undefined {
  if (!cached && !streamed) return undefined;
  if (!cached) return streamed;
  if (!streamed) return cached;
  return mergeBriefState(cached, streamed);
}

export type { BriefRequirement };
