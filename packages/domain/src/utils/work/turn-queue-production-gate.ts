import type { TurnQueuePlannerKind } from "../../models/agent/turn.js";
import type { WorkPreview } from "../../models/work/preview.js";
import type { WorkProduction } from "../../models/work/production.js";
import type { WorkProfile } from "../../models/work/profile.js";
import { isProfileSetupReady } from "./profile-setup.js";

const REVISION_QUEUE_KINDS = [
  "collectRevision",
  "revise",
] as const satisfies readonly TurnQueuePlannerKind[];

export type ProductionQueueGateOptions = {
  preview?: WorkPreview | null;
  production?: WorkProduction | null;
};

/**
 * 创作定位 + 体裁已齐（`isProfileSetupReady`）时允许 production 入队。
 * 风格 / 背景 / 需求 / 边界等可选步未填不拦截；与产品「方案就绪」口径一致。
 */
export function canQueueProduction(
  profile: WorkProfile,
  _options: ProductionQueueGateOptions = {},
): boolean {
  return isProfileSetupReady(profile);
}

/**
 * 对 planner 队列做确定性 production 门禁（不解析用户话术）：
 * - 定位+体裁未齐 → 剔除 production
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
