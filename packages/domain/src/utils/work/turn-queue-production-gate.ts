import type { TurnQueuePlannerKind } from "../../models/agent/turn.js";
import type { WorkPreview } from "../../models/work/preview.js";
import type { WorkProduction } from "../../models/work/production.js";
import type { WorkProfile } from "../../models/work/profile.js";
import { previewHasContent } from "./preview.js";
import {
  buildProfileSetupProgressOptions,
  getActiveProfileStep,
} from "./profile-setup.js";

const REVISION_QUEUE_KINDS = [
  "collectRevision",
  "revise",
] as const satisfies readonly TurnQueuePlannerKind[];

export type ProductionQueueGateOptions = {
  preview?: WorkPreview | null;
  production?: WorkProduction | null;
};

/** 方案向导已到「方案就绪」步时，才允许 production 入队。 */
export function canQueueProduction(
  profile: WorkProfile,
  options: ProductionQueueGateOptions = {},
): boolean {
  const progressOptions = buildProfileSetupProgressOptions({
    profile,
    preview: options.preview,
    production: options.production,
    hasPreview: previewHasContent(options.preview),
  });

  const activeStep = getActiveProfileStep(
    profile,
    progressOptions.skippedSteps ?? [],
    { lockAtReady: progressOptions.lockAtReady },
  );

  return activeStep === "ready";
}

/**
 * 对 planner 队列做确定性 production 门禁（不解析用户话术）：
 * - 方案向导未到 ready → 剔除 production
 * - 含 production 时剔除 collectRevision / revise（与整稿重做互斥）
 */
export function filterProductionQueue(
  queue: TurnQueuePlannerKind[],
  profile: WorkProfile,
  options: ProductionQueueGateOptions = {},
): TurnQueuePlannerKind[] {
  if (!queue.includes("production")) {
    return queue;
  }

  if (!canQueueProduction(profile, options)) {
    return queue.filter((kind) => kind !== "production");
  }

  return queue.filter(
    (kind) => !(REVISION_QUEUE_KINDS as readonly string[]).includes(kind),
  );
}
