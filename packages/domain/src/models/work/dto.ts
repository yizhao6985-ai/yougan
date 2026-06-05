import type { WorkProfile } from "./profile.js";
import type { WorkPreview } from "./preview.js";
import type { WorkProductionPlan } from "./plan.js";

/** API / 前端作品 DTO（canonical 物化视图 + head revision） */
export interface WorkDTO {
  id: string;
  userId: string;
  groupId: string | null;
  title: string;
  /** 创作轮廓（含 references、spec、beats 等） */
  profile: WorkProfile;
  /** 内部制作计划，Agent 持久化用；前端默认不展示 */
  productionPlan: WorkProductionPlan;
  preview: WorkPreview | null;
  headRevisionId: string | null;
  sourceWorkId: string | null;
  sourceRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
}
