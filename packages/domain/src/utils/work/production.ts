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

/** 解析 production JSON（含 preview） */
export function parseProductionJson(raw: unknown): WorkProduction {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_PRODUCTION };
  }
  const value = raw as WorkProduction;
  return committedProduction({
    pending_tasks: value.pending_tasks ?? [],
    summary: value.summary ?? null,
    preview:
      value.preview !== undefined
        ? parseWorkPreview(value.preview)
        : null,
  });
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

  const fromPlan = parseProductionJson(input.productionPlan);
  if (input.preview !== undefined) {
    return {
      ...fromPlan,
      preview: input.preview === null ? null : parseWorkPreview(input.preview),
    };
  }
  return fromPlan;
}

