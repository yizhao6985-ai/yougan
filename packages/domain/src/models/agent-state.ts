import type { WorkBlueprint } from "./work/blueprint.js";
import type { WorkDraft } from "./work/draft.js";
import type { WorkProductionPlan } from "./work/plan.js";
import type { WorkProfile } from "./work/profile.js";
import type { BriefSuggestions } from "./suggestions.js";
import type { TurnQueueKind } from "./chat/turn-queue.js";

export interface YouganAgentState {
  workId?: string;
  workTitle?: string;
  conversationTitle?: string;
  /** 参考素材等跨模式字段 */
  profile: WorkProfile;
  blueprint: WorkBlueprint;
  /** 创作总监计划，仅 Agent 内部使用 */
  plan: WorkProductionPlan;
  draft: WorkDraft | null;
  turnQueue?: TurnQueueKind[];
  activeTurnKind?: TurnQueueKind | null;
  completedTurnKinds?: TurnQueueKind[];
  /** 空 thread 开屏选题建议 */
  openingNextStepSuggestions: BriefSuggestions | null;
  /** 回合结束后下一步工作建议 */
  turnNextStepSuggestions: BriefSuggestions | null;
  /** 首条用户消息后生成的对话标题建议（由 API 写入 WorkConversation） */
  suggestedConversationTitle?: string;
}

/** 推送到前端的 stream 字段（不含内部 plan） */
export type YouganStreamValues = Partial<
  Pick<
    YouganAgentState,
    | "workId"
    | "workTitle"
    | "conversationTitle"
    | "profile"
    | "blueprint"
    | "draft"
    | "turnQueue"
    | "activeTurnKind"
    | "completedTurnKinds"
    | "openingNextStepSuggestions"
    | "turnNextStepSuggestions"
    | "suggestedConversationTitle"
  >
> & {
  /** LangGraph checkpoint messages（仅 stream 运行时） */
  messages?: unknown[];
  modelTemperature?: number;
};

/** 前端 submit / agent-proxy 注入的完整运行时输入（含内部 plan） */
export type YouganAgentSubmitInput = YouganStreamValues &
  Pick<YouganAgentState, "plan">;
