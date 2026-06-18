/** 方案中的正文字数约束（从 context/bounds 自然语言推断；无结构化字数时返回 null） */
import type { WorkProfile } from "@yougan/domain";
import { parseProfileJson } from "@yougan/domain";

function extractWordCountHint(text: string): string | null {
  const match =
    text.match(/(?:全文|正文|总共?|控制在?)\s*(?:约|大约)?\s*(\d+)\s*字/) ??
    text.match(/(\d+)\s*字\s*(?:以内|左右|上下)/);
  if (!match?.[1]) return null;
  const max = Number(match[1]);
  if (!Number.isFinite(max) || max <= 0) return null;
  return `正文须控制在约 ${max} 字（含标点，不含标题与 hashtags）；明显超出视为未达标。`;
}

export function buildWordCountRequirement(
  profile: WorkProfile,
): string | null {
  const normalized = parseProfileJson(profile);
  for (const item of [...normalized.context, ...normalized.bounds]) {
    const hint = extractWordCountHint(item.spec);
    if (hint) return hint;
  }
  for (const item of normalized.sequence) {
    const hint = extractWordCountHint(item.spec);
    if (hint) return hint;
  }
  return null;
}

export function countTextChars(text: string): number {
  return text.replace(/\s/g, "").length;
}
