/**
 * LangGraph 运行时状态定义。
 *
 * 作品级长记忆（跨对话持久化，存 Work 表 JSON 字段）：
 *   profile                → Work.profile（含 references）
 *   plan (ProductionPlan)  → Work.outline（DB 列名保留）
 *   inspiration            → Work.inspiration
 *   creation               → Work.creation
 *
 * 对话级会话（存 WorkConversation + LangGraph checkpoint）：
 *   messages               → checkpoint thread
 *   mode                   → WorkConversation.mode
 *   inspirationSuggestions → 仅运行时，流式传给前端，不持久化
 */
import {
  Annotation,
  MessagesAnnotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

import { mergeInspirationState } from "./lib/inspiration-merge.js";
import { env } from "./env.js";
import {
  EMPTY_WORK_INSPIRATION,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  type ChatMode,
  type GeneratedContent,
  type InspirationSuggestions,
  type WorkInspiration,
  type WorkProductionPlan,
  type WorkProfile,
} from "./schema.js";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  /** 当前创作模式：inspiration | creation | ask */
  mode: Annotation<ChatMode>({
    reducer: (_prev, next) => next ?? "inspiration",
    default: () => "inspiration",
  }),
  workId: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  profile: Annotation<WorkProfile>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PROFILE,
    default: () => EMPTY_WORK_PROFILE,
  }),
  inspiration: Annotation<WorkInspiration>({
    reducer: (prev, next) => {
      if (next === undefined) return prev ?? EMPTY_WORK_INSPIRATION;
      return mergeInspirationState(prev, next);
    },
    default: () => EMPTY_WORK_INSPIRATION,
  }),
  /** 创意总监制作计划，对应 Work.outline 列 */
  plan: Annotation<WorkProductionPlan>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PRODUCTION_PLAN,
    default: () => EMPTY_WORK_PRODUCTION_PLAN,
  }),
  /** 灵感模式结构化建议，由 generateSuggestions 节点写入，不入库 */
  inspirationSuggestions: Annotation<InspirationSuggestions | null>({
    reducer: (_prev, next) => (next === undefined ? _prev : next),
    default: () => null,
  }),
  creation: Annotation<GeneratedContent | null>({
    reducer: (_prev, next) => (next === undefined ? null : next),
    default: () => null,
  }),
  /** 用户「创意度」；仅创作团队出稿工具读取，ReAct 编排与结构化节点不使用。 */
  modelTemperature: Annotation<number>({
    reducer: (_prev, next) => {
      if (next === undefined) return _prev ?? env.llmTemperature;
      return Math.min(1, Math.max(0.1, Math.round(next * 10) / 10));
    },
    default: () => env.llmTemperature,
  }),
});

export type AgentStateType = typeof AgentState.State;
