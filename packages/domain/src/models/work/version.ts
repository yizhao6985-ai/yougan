import type { WorkProfile } from "./profile.js";
import type { WorkPreview } from "./preview.js";
import type { WorkProductionPlan } from "./plan.js";
import type { WorkReference } from "./reference.js";

/** 版本快照内容（与 TurnStaging / state 顶层字段对齐） */
export interface WorkVersionSnapshot {
  profile: WorkProfile;
  references: WorkReference[];
  productionPlan: WorkProductionPlan;
  preview: WorkPreview | null;
}
