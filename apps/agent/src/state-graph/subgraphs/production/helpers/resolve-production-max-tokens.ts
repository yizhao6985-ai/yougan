import { env } from "#agent/env.js";
import type { WorkProfile } from "@yougan/domain";
import { parseProfileJson } from "@yougan/domain";

import { buildWordCountRequirement } from "./word-count-guidance.js";

const PRODUCTION_OUTPUT_CAP = 65_536;

function tokensForWordCount(maxChars: number): number {
  return Math.ceil(maxChars * 2.5) + 4096;
}

function extractMaxChars(profile: WorkProfile): number | null {
  const hint = buildWordCountRequirement(profile);
  if (!hint) return null;
  const match = hint.match(/约?\s*(\d+)\s*字/);
  if (!match?.[1]) return null;
  const max = Number(match[1]);
  return Number.isFinite(max) && max > 0 ? max : null;
}

export function resolveProductionMaxTokens(profile: WorkProfile): number {
  const base = env.llmProductionMaxTokens;
  const normalized = parseProfileJson(profile);
  const maxChars = extractMaxChars(normalized);
  if (maxChars == null) return base;

  return Math.min(
    PRODUCTION_OUTPUT_CAP,
    Math.max(base, tokensForWordCount(maxChars)),
  );
}
