import {
  committedProduction,
  EMPTY_WORK_PRODUCTION,
  type WorkPreview,
  type WorkProduction,
} from "../../models/work/production.js";

export function getPlanSummary(production: WorkProduction): string | null {
  return production.summary ?? null;
}

export function parseWorkPreview(raw: unknown): WorkPreview | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as WorkPreview;
  if (!value.body || !value.platform) return null;
  return value;
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

