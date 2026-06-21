import type { WorkProfile } from "../work/profile.js";
import type { WorkProduction } from "../work/production.js";
import type { WorkPreview } from "../work/preview.js";
import type { WorkReference } from "../work/reference.js";
import type { WorkRevision } from "../work/revision.js";
import type { NextStepSuggestions } from "./suggestions.js";
import type { RunProgress } from "./run-progress.js";
import type { AiUsageSnapshot } from "./ai-usage.js";
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
  /** 已提交作品预览（成稿） */
  preview: WorkPreview | null;
  /** 改稿意见清单 */
  revision: WorkRevision;
  /** 已提交制作计划（不含 preview） */
  production: WorkProduction;
  /** 回合末或开屏生成的下一步建议（不入库） */
  nextStepSuggestions: NextStepSuggestions | null;
  /** 单轮执行运行时（调度、staging、取消） */
  turn: TurnRuntime;
  /** API 注入；单次 LLM 结算后更新 */
  aiUsage?: AiUsageSnapshot;
  /** 当前运行进度（不入库；回合结束清空） */
  runProgress?: RunProgress | null;
}

/**
 * 推送到前端的 stream values。
 * 含 turn.staging 供侧栏实时预览。
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
    | "revision"
    | "production"
    | "nextStepSuggestions"
    | "turn"
    | "aiUsage"
    | "runProgress"
  >
> & {
  messages?: unknown[];
  modelTemperature?: number;
};

/** 前端 submit / agent-proxy 注入的完整运行时输入 */
export type YouganAgentSubmitInput = YouganStreamValues;
