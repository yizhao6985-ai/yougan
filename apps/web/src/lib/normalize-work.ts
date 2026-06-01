import type { Work } from "@/lib/types";
import {
  EMPTY_WORK_BRIEF,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
} from "@/lib/types";

function normalizePlan(plan: Work["plan"] | undefined): Work["plan"] {
  return {
    ...EMPTY_WORK_PRODUCTION_PLAN,
    ...plan,
    pending_tasks: plan?.pending_tasks ?? [],
    executed_tasks: plan?.executed_tasks ?? [],
    ready: plan?.ready ?? false,
    summary: plan?.summary ?? null,
    director_notes: plan?.director_notes ?? null,
  };
}

function normalizeBrief(brief: Work["brief"] | undefined): Work["brief"] {
  return {
    ...EMPTY_WORK_BRIEF,
    ...brief,
    requirements: brief?.requirements ?? [],
    ready: brief?.ready ?? false,
  };
}

export function normalizeWork(work: Work): Work {
  return {
    ...work,
    groupId: work.groupId ?? null,
    headRevisionId: work.headRevisionId ?? null,
    sourceWorkId: work.sourceWorkId ?? null,
    sourceRevisionId: work.sourceRevisionId ?? null,
    profile: work.profile ?? { ...EMPTY_WORK_PROFILE, references: [] },
    plan: normalizePlan(work.plan),
    brief: normalizeBrief(work.brief),
    draft: work.draft ?? null,
  };
}
