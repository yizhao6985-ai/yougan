import { env } from "#agent/env.js";
import type { WorkProfile } from "@yougan/domain";

const PRODUCTION_OUTPUT_CAP = 65_536;

/** 中文正文粗算：约 1.5–2 token/字，为 functionCalling 与整合留余量 */
function tokensForWordCount(maxChars: number): number {
  return Math.ceil(maxChars * 2.5) + 4096;
}

/**
 * 制作 LLM 输出 token 上限：默认 LLM_PRODUCTION_MAX_TOKENS；
 * 若方案写明正文字数上限，则按篇幅抬高（不超过 PRODUCTION_OUTPUT_CAP）。
 */
export function resolveProductionMaxTokens(profile: WorkProfile): number {
  const base = env.llmProductionMaxTokens;
  if (profile.params.kind !== "text") return base;

  const maxChars = profile.params.word_count?.max;
  if (maxChars == null || maxChars <= 0) return base;

  return Math.min(
    PRODUCTION_OUTPUT_CAP,
    Math.max(base, tokensForWordCount(maxChars)),
  );
}
