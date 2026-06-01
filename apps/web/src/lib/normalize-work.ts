import type { Work } from "@/lib/types";
import {
  EMPTY_WORK_INSPIRATION,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
} from "@/lib/types";

export function normalizeWork(work: Work): Work {
  return {
    ...work,
    groupId: work.groupId ?? null,
    profile: work.profile ?? { ...EMPTY_WORK_PROFILE, references: [] },
    outline: {
      ...EMPTY_WORK_PRODUCTION_PLAN,
      ...work.outline,
      pending_changes: work.outline?.pending_changes ?? [],
      executed_changes: work.outline?.executed_changes ?? [],
      plan_ready: work.outline?.plan_ready ?? work.outline?.outline_ready ?? false,
      plan_summary:
        work.outline?.plan_summary ?? work.outline?.outline_summary ?? null,
    },
    inspiration: {
      ...EMPTY_WORK_INSPIRATION,
      ...work.inspiration,
      confirmed_requirements: work.inspiration?.confirmed_requirements ?? [],
    },
  };
}
