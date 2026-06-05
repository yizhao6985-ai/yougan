import type { Work } from "@/lib/types";

/** 作品列表副标题：优先展示创作主题，不展示平台 */
export function workSubtitle(
  work: Pick<Work, "blueprint">,
): string | null {
  const topic = work.blueprint?.spec?.content_topic?.trim();
  if (topic) return topic;
  const premise = work.blueprint?.premise?.trim();
  if (premise) return premise.length > 24 ? `${premise.slice(0, 24)}…` : premise;
  return null;
}
