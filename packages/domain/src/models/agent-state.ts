import type { WorkProfile } from "./work/profile.js";
import type { WorkPreview } from "./work/preview.js";
import type { WorkProductionPlan } from "./work/plan.js";
import type { TurnStaging } from "./work/staging.js";
import type { NextStepSuggestions } from "./suggestions.js";
import type { TurnQueueKind } from "./chat/turn-queue.js";

export interface YouganAgentState {
  workId?: string;
  workTitle?: string;
  conversationTitle?: string;
  /** canonical：已提交作品方案 */
  profile: WorkProfile;
  /** canonical：已提交制作计划（内部） */
  productionPlan: WorkProductionPlan;
  /** canonical：已提交作品预览 */
  preview: WorkPreview | null;
  /** 本轮工作区；TurnRunner 只写 staging */
  staging?: TurnStaging | null;
  /** turn.commit 成功后为 true，API 据此物化 Work */
  turnCommitted?: boolean;
  /** 用户取消本轮：作品 state 不落库 */
  turnCancelled?: boolean;
  /** 被用户中断的 assistant 消息 id */
  interruptedMessageIds?: string[];
  turnQueue?: TurnQueueKind[];
  activeTurnKind?: TurnQueueKind | null;
  completedTurnKinds?: TurnQueueKind[];
  nextStepSuggestions: NextStepSuggestions | null;
  suggestedConversationTitle?: string;
}

/** 推送到前端的 stream 字段（含 staging 供预览，不含 productionPlan） */
export type YouganStreamValues = Partial<
  Pick<
    YouganAgentState,
    | "workId"
    | "workTitle"
    | "conversationTitle"
    | "profile"
    | "preview"
    | "staging"
    | "turnCommitted"
    | "turnCancelled"
    | "interruptedMessageIds"
    | "turnQueue"
    | "activeTurnKind"
    | "completedTurnKinds"
    | "nextStepSuggestions"
    | "suggestedConversationTitle"
  >
> & {
  messages?: unknown[];
  modelTemperature?: number;
};

/** 前端 submit / agent-proxy 注入的完整运行时输入 */
export type YouganAgentSubmitInput = YouganStreamValues &
  Pick<YouganAgentState, "productionPlan">;
