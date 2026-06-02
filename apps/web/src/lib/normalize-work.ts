import type { Work } from "@/lib/types";
import {
  EMPTY_WORK_PROFILE,
  parseBriefJson,
  parseOutlineJson,
  parsePlanJson,
} from "@/lib/types";

function normalizeOutline(outline: Work["outline"] | undefined): Work["outline"] {
  return parseOutlineJson(outline);
}

function normalizePlan(plan: Work["plan"] | undefined): Work["plan"] {
  return parsePlanJson(plan);
}

function normalizeBrief(brief: Work["brief"] | undefined): Work["brief"] {
  return parseBriefJson(brief);
}

export function normalizeWork(work: Work): Work {
  return {
    ...work,
    groupId: work.groupId ?? null,
    headRevisionId: work.headRevisionId ?? null,
    sourceWorkId: work.sourceWorkId ?? null,
    sourceRevisionId: work.sourceRevisionId ?? null,
    profile: work.profile ?? { ...EMPTY_WORK_PROFILE, references: [] },
    outline: normalizeOutline(work.outline),
    plan: normalizePlan(work.plan),
    brief: normalizeBrief(work.brief),
    draft: work.draft ?? null,
  };
}
