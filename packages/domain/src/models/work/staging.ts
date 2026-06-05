import type { TurnQueueKind } from "../chat/turn-queue.js";
import type { ProductionDepartment, WorkProductionPlan } from "./plan.js";
import type { WorkPreview } from "./preview.js";
import type { WorkProfile } from "./profile.js";

export const TURN_STAGING_OUTCOMES = [
  "pending",
  "committed",
  "rolled_back",
  "failed",
] as const;

export type TurnStagingOutcome = (typeof TURN_STAGING_OUTCOMES)[number];

/** 制作子图质检元数据（staging 内） */
export interface ProductionStagingMeta {
  /** 待质检的任务 id */
  inspectTaskId?: string | null;
  /** 当前任务已重试次数 */
  inspectRetryCount?: number;
  /** 最近一次质检反馈（供重试使用） */
  lastInspectFeedback?: string | null;
  /** 工具产出后置 true，inspect 消费后清除 */
  pendingInspect?: boolean;
  /** 重试时回到的管线：writing → llm-call，design → design-llm-call */
  inspectPipeline?: "writing" | "design" | null;
  /** tool 请求后由 generateDraft work node 消费 */
  pendingGenerateDraft?: boolean;
  /** tool 请求后由 spawnSpecialist work node 消费 */
  pendingSpawnSpecialist?: {
    department: ProductionDepartment;
    brief: string;
    specialist_name?: string | null;
  } | null;
}

/** profile 子图 work 队列（staging 内） */
export interface ProfileStagingMeta {
  pendingParseReferenceText?: string | null;
  pendingParseReferenceImage?: {
    image_url: string;
    hint?: string | null;
  } | null;
}

export interface TurnStagingMeta {
  initialTurnQueue: TurnQueueKind[];
  completedTurns: TurnQueueKind[];
  outcome: TurnStagingOutcome;
  gaps?: string[];
  profile?: ProfileStagingMeta;
  production?: ProductionStagingMeta;
}

/** 单轮事务工作区：TurnRunner 只写 staging，turn.commit 提交到 canonical */
export interface TurnStaging {
  profile: WorkProfile;
  productionPlan: WorkProductionPlan;
  preview: WorkPreview | null;
  meta: TurnStagingMeta;
}
