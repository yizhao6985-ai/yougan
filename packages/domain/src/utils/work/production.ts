import type { ContentFormatId } from "../../models/content-form/formats.js";
import {
  committedProduction,
  EMPTY_WORK_PRODUCTION,
  type WorkProduction,
} from "../../models/work/production.js";
import { parseWorkPreview } from "./preview.js";

export { parseWorkPreview } from "./preview.js";

/** 用户对本轮制作的要求（production.summary） */
export function getUserRequirements(
  production: WorkProduction,
): string | null {
  return production.summary ?? null;
}

/** 解析 production JSON（不含 preview） */
export function parseProductionJson(raw: unknown): WorkProduction {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_PRODUCTION };
  }
  const value = raw as WorkProduction;
  return committedProduction({
    pending_tasks: value.pending_tasks ?? [],
    summary: value.summary ?? null,
  });
}

/** 从 Work 顶层 preview 字段解析 */
export function resolvePreviewFromWork(input: {
  preview?: unknown | null;
  format?: ContentFormatId | null;
}): ReturnType<typeof parseWorkPreview> {
  if (input.preview === undefined || input.preview === null) {
    return null;
  }
  return parseWorkPreview(input.preview, { format: input.format });
}
