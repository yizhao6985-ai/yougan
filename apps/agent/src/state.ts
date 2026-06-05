/**
 * LangGraph 运行时状态定义。
 */
import {
  Annotation,
  MessagesAnnotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import {
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION_PLAN,
  mergeProfileState,
  type NextStepSuggestions,
  type TurnQueueKind,
  type TurnStaging,
  type WorkPreview,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";

import { env } from "./env.js";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  turnQueue: Annotation<TurnQueueKind[]>({
    reducer: (_prev, next) => (next === undefined ? (_prev ?? []) : next),
    default: () => [],
  }),
  activeTurnKind: Annotation<TurnQueueKind | null>({
    reducer: (_prev, next) => (next === undefined ? (_prev ?? null) : next),
    default: () => null,
  }),
  completedTurnKinds: Annotation<TurnQueueKind[]>({
    reducer: (_prev, next) => (next === undefined ? (_prev ?? []) : next),
    default: () => [],
  }),
  workId: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  workTitle: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  conversationTitle: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  suggestedConversationTitle: Annotation<string | null>({
    reducer: (_prev, next) => (next === undefined ? (_prev ?? null) : next),
    default: () => null,
  }),
  /** canonical：已提交作品方案 */
  profile: Annotation<WorkProfile>({
    reducer: (prev, next) => {
      if (next === undefined) return prev ?? EMPTY_WORK_PROFILE;
      return mergeProfileState(prev, next);
    },
    default: () => EMPTY_WORK_PROFILE,
  }),
  /** canonical：已提交制作计划 */
  productionPlan: Annotation<WorkProductionPlan>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PRODUCTION_PLAN,
    default: () => EMPTY_WORK_PRODUCTION_PLAN,
  }),
  /** canonical：已提交作品预览 */
  preview: Annotation<WorkPreview | null>({
    reducer: (_prev, next) => (next === undefined ? null : next),
    default: () => null,
  }),
  /** 本轮工作区 */
  staging: Annotation<TurnStaging | null>({
    reducer: (_prev, next) => (next === undefined ? (_prev ?? null) : next),
    default: () => null,
  }),
  /** turn.commit 成功后为 true，API 据此物化 Work */
  turnCommitted: Annotation<boolean>({
    reducer: (_prev, next) => (next === undefined ? (_prev ?? false) : next),
    default: () => false,
  }),
  /** 用户取消本轮：commit 跳过，staging 回滚 */
  turnCancelled: Annotation<boolean>({
    reducer: (_prev, next) => (next === undefined ? (_prev ?? false) : next),
    default: () => false,
  }),
  /** 被用户中断的 assistant 消息 id（前端 stop 写入） */
  interruptedMessageIds: Annotation<string[]>({
    reducer: (prev, next) => {
      if (next === undefined) return prev ?? [];
      return [...new Set([...(prev ?? []), ...next])];
    },
    default: () => [],
  }),
  /** 验收通过后生成的下一步可点击建议（开屏 7 条 / 对话流 4 条） */
  nextStepSuggestions: Annotation<NextStepSuggestions | null>({
    reducer: (_prev, next) => (next === undefined ? _prev : next),
    default: () => null,
  }),
  modelTemperature: Annotation<number>({
    reducer: (_prev, next) => {
      if (next === undefined) return _prev ?? env.llmTemperature;
      return Math.min(1, Math.max(0.1, Math.round(next * 10) / 10));
    },
    default: () => env.llmTemperature,
  }),
});

export type AgentStateType = typeof AgentState.State;
