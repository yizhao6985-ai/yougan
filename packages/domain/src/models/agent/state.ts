import type { WorkProfile } from "../work/profile.js";
import type { WorkPreview } from "../work/preview.js";
import type { WorkProductionPlan } from "../work/plan.js";
import type { WorkReference } from "../work/reference.js";
import type { TurnStaging } from "./staging.js";
import type { NextStepSuggestions } from "./suggestions.js";
import type { TurnQueueKind } from "./turn-queue.js";

/**
 * LangGraph 主图状态（YouganAgentState Annotation）。
 * state 顶层字段在 turn.commit 后落库；staging 仅本轮有效。
 */
export interface YouganAgentState {
  workId?: string;
  workTitle?: string;
  conversationTitle?: string;
  /** 已提交作品方案 */
  profile: WorkProfile;
  /** 已提交参考素材 */
  references: WorkReference[];
  /** 已提交制作计划（内部） */
  productionPlan: WorkProductionPlan;
  /** 已提交作品预览 */
  preview: WorkPreview | null;
  /** 本轮工作区；子图只写 staging */
  staging?: TurnStaging | null;
  /** commitTurn 成功后为 true，API 据此 PATCH Work */
  turnCommitted?: boolean;
  /** 用户停止生成：本轮变更不落库 */
  turnCancelled?: boolean;
  interruptedMessageIds?: string[];
  /** 本轮待执行子图队列（workflowTurn → dispatchTurnQueue） */
  turnQueue?: TurnQueueKind[];
  activeTurnKind?: TurnQueueKind | null;
  completedTurnKinds?: TurnQueueKind[];
  nextStepSuggestions: NextStepSuggestions | null;
  /** 首条消息后生成的对话标题（verify 节点写入） */
  generatedConversationTitle?: string | null;
}

/**
 * 推送到前端的 stream values。
 * 含 staging 供侧栏实时预览；不含 productionPlan（内部字段）。
 */
export type YouganStreamValues = Partial<
  Pick<
    YouganAgentState,
    | "workId"
    | "workTitle"
    | "conversationTitle"
    | "profile"
    | "references"
    | "preview"
    | "staging"
    | "turnCommitted"
    | "turnCancelled"
    | "interruptedMessageIds"
    | "turnQueue"
    | "activeTurnKind"
    | "completedTurnKinds"
    | "nextStepSuggestions"
    | "generatedConversationTitle"
  >
> & {
  messages?: unknown[];
  modelTemperature?: number;
};

/** 前端 submit / agent-proxy 注入的完整运行时输入（含 productionPlan） */
export type YouganAgentSubmitInput = YouganStreamValues &
  Pick<YouganAgentState, "productionPlan">;
