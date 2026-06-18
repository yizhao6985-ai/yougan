import type { Work } from "@/lib/types";

/** 作品列表副标题：优先展示创作主题，不展示平台 */
export function workSubtitle(
  work: Pick<Work, "profile">,
): string | null {
  const summary = work.profile?.direction?.summary?.trim();
  if (summary) return summary.length > 24 ? `${summary.slice(0, 24)}…` : summary;
  return null;
}
