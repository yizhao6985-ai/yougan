import type { UserRevisionPhase } from "@/lib/types";

export const REVISION_PHASE_LABELS: Record<UserRevisionPhase, string> = {
  inspiration: "灵感",
  draft: "成稿",
};

export function revisionPhaseLabel(phase: UserRevisionPhase): string {
  return REVISION_PHASE_LABELS[phase] ?? phase;
}

export function formatRevisionTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
