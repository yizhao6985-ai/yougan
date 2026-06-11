import type { ProductionDepartment, WorkProductionPlan } from "../work/plan.js";
import type { WorkPreview } from "../work/preview.js";
import type { WorkProfile } from "../work/profile.js";
import type { WorkReference } from "../work/reference.js";

/** 单轮事务结局 */
export const TURN_STAGING_OUTCOMES = [
  "pending",
  "committed",
  "rolled_back",
  "failed",
] as const;

export type TurnStagingOutcome = (typeof TURN_STAGING_OUTCOMES)[number];

/** 制作子图质检与 work node 挂起状态（仅本轮有效） */
export interface ProductionStagingMeta {
  /** 待质检的 deliverable 任务 id */
  inspectTaskId?: string | null;
  inspectRetryCount?: number;
  lastInspectFeedback?: string | null;
  /** 工具产出后置 true，inspect 消费后清除 */
  pendingInspect?: boolean;
  /** 重试时回到的管线：writing → directWriting，design → directDesign */
  inspectPipeline?: "writing" | "design" | null;
  /** generate_draft tool 请求后由 work node 消费 */
  pendingGenerateDraft?: boolean;
  pendingSpawnSpecialist?: {
    department: ProductionDepartment;
    brief: string;
    specialist_name?: string | null;
  } | null;
}

/** 单轮 staging 元数据（队列进度见 TurnRuntime.queue / completedKinds） */
export interface TurnStagingMeta {
  outcome: TurnStagingOutcome;
  /** 单轮未决缺口（可选，供调试或后续验收扩展） */
  gaps?: string[];
  production?: ProductionStagingMeta;
}

/**
 * 单轮事务工作区。
 * 子图只写 turn.staging；commitTurn 一次性提交到 state 顶层 + Work 持久化。
 */
export interface TurnStaging {
  profile: WorkProfile;
  references: WorkReference[];
  productionPlan: WorkProductionPlan;
  preview: WorkPreview | null;
  meta: TurnStagingMeta;
}
