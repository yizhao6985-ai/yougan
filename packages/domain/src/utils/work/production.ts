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

function extractLegacyPreview(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as { preview?: unknown };
  return value.preview;
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

/** 从 Work 字段解析 preview（顶层优先，兼容 production.preview） */
export function resolvePreviewFromWork(input: {
  preview?: unknown | null;
  production?: unknown;
  format?: ContentFormatId | null;
}): ReturnType<typeof parseWorkPreview> {
  const options = { format: input.format };
  if (input.preview !== undefined && input.preview !== null) {
    return parseWorkPreview(input.preview, options);
  }
  const legacy = extractLegacyPreview(input.production);
  if (legacy !== undefined) {
    return legacy === null ? null : parseWorkPreview(legacy, options);
  }
  return null;
}

/** 从旧列 productionPlan + preview 或版本快照合并解析 */
export function parseProductionFromLegacyFields(input: {
  production?: unknown;
  productionPlan?: unknown;
  preview?: unknown | null;
}): WorkProduction {
  if (
    input.production !== undefined &&
    input.production !== null &&
    typeof input.production === "object"
  ) {
    return parseProductionJson(input.production);
  }

  return parseProductionJson(input.productionPlan);
}
