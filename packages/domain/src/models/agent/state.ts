import type { WorkProfile } from "../work/profile.js";
import type { WorkPreview } from "../work/preview.js";
import type { WorkProductionPlan } from "../work/plan.js";
import type { WorkReference } from "../work/reference.js";
import type { NextStepSuggestions } from "./suggestions.js";
import type { TurnRuntime } from "./turn.js";

/**
 * LangGraph 主图状态（YouganAgentState Annotation）。
 * state 顶层作品字段在 turn.committed 后落库；回合执行态在 turn 对象内。
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
  /** 回合末或开屏生成的下一步建议（不入库） */
  nextStepSuggestions: NextStepSuggestions | null;
  /** 首条用户消息后生成的对话标题建议（占位标题时由 API 落库） */
  generatedConversationTitle: string | null;
  /** 单轮执行运行时（调度、staging、取消） */
  turn: TurnRuntime;
}

/**
 * 推送到前端的 stream values。
 * 含 turn.staging 供侧栏实时预览；不含 productionPlan（内部字段）。
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
    | "nextStepSuggestions"
    | "generatedConversationTitle"
    | "turn"
  >
> & {
  messages?: unknown[];
  modelTemperature?: number;
};

/** 前端 submit / agent-proxy 注入的完整运行时输入（含 productionPlan） */
export type YouganAgentSubmitInput = YouganStreamValues &
  Pick<YouganAgentState, "productionPlan">;
