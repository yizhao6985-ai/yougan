import type { WorkProfile } from "@yougan/domain";

/** 方案中的正文字数约束（供产出与验收 prompt 使用） */
export function buildWordCountRequirement(
  profile: WorkProfile,
): string | null {
  const { min, max } = profile.delivery.media_params.text?.word_count ?? {};
  if (min == null && max == null) return null;

  if (min != null && max != null) {
    return `正文须控制在 ${min}–${max} 字（含标点，不含标题与 hashtags）；不足或明显超出视为未达标。`;
  }
  if (min != null) {
    return `正文不少于 ${min} 字（含标点，不含标题与 hashtags）；明显不足视为未达标。`;
  }
  return `正文不超过 ${max} 字（含标点，不含标题与 hashtags）；明显超出视为未达标。`;
}

export function countTextChars(text: string): number {
  return text.replace(/\s/g, "").length;
}
