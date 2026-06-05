import {
  EMPTY_WORK_PROFILE,
  type WorkProfile,
} from "../../models/work/profile.js";
import {
  EMPTY_WORK_PRODUCTION_PLAN,
  type WorkProductionPlan,
} from "../../models/work/plan.js";
import type { WorkPreview } from "../../models/work/preview.js";
import type {
  ProductionStagingMeta,
  TurnStaging,
  TurnStagingMeta,
} from "../../models/work/staging.js";
import type { TurnQueueKind } from "../../models/chat/turn-queue.js";

export function forkTurnStaging(input: {
  profile: WorkProfile;
  productionPlan: WorkProductionPlan;
  preview: WorkPreview | null;
  turnQueue: TurnQueueKind[];
}): TurnStaging {
  const meta: TurnStagingMeta = {
    initialTurnQueue: [...input.turnQueue],
    completedTurns: [],
    outcome: "pending",
    production: {},
  };
  return {
    profile: structuredClone(input.profile ?? EMPTY_WORK_PROFILE),
    productionPlan: structuredClone(
      input.productionPlan ?? EMPTY_WORK_PRODUCTION_PLAN,
    ),
    preview: input.preview ? structuredClone(input.preview) : null,
    meta,
  };
}

export function commitTurnStaging(staging: TurnStaging): {
  profile: WorkProfile;
  productionPlan: WorkProductionPlan;
  preview: WorkPreview | null;
} {
  return {
    profile: staging.profile,
    productionPlan: staging.productionPlan,
    preview: staging.preview,
  };
}

export function emptyProductionStagingMeta(): ProductionStagingMeta {
  return {
    inspectTaskId: null,
    inspectRetryCount: 0,
    lastInspectFeedback: null,
    pendingInspect: false,
    inspectPipeline: null,
  };
}
