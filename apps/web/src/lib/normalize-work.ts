import type { Work } from "@/lib/types";
import {
  EMPTY_WORK_INSPIRATION,
  EMPTY_WORK_OUTLINE,
  EMPTY_WORK_PROFILE,
} from "@/lib/types";

export function normalizeWork(work: Work): Work {
  return {
    ...work,
    groupId: work.groupId ?? null,
    profile: work.profile ?? { ...EMPTY_WORK_PROFILE, references: [] },
    outline: {
      ...EMPTY_WORK_OUTLINE,
      ...work.outline,
      pending_changes: work.outline?.pending_changes ?? [],
      executed_changes: work.outline?.executed_changes ?? [],
    },
    inspiration: {
      ...EMPTY_WORK_INSPIRATION,
      ...work.inspiration,
      confirmed_requirements: work.inspiration?.confirmed_requirements ?? [],
    },
  };
}
