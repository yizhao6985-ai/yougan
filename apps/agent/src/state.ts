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
  EMPTY_WORK_BLUEPRINT,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  mergeBlueprintState,
  type BriefSuggestions,
  type TurnQueueKind,
  type WorkBlueprint,
  type WorkDraft,
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
  /** 本轮待执行队列（队首为当前/下一项） */
  turnQueue: Annotation<TurnQueueKind[]>({
    reducer: (_prev, next) => (next === undefined ? _prev ?? [] : next),
    default: () => [],
  }),
  /** 当前正在执行的队列项 */
  activeTurnKind: Annotation<TurnQueueKind | null>({
    reducer: (_prev, next) => (next === undefined ? _prev ?? null : next),
    default: () => null,
  }),
  /** 本轮已完成的队列项（用于回合末建议等） */
  completedTurnKinds: Annotation<TurnQueueKind[]>({
    reducer: (_prev, next) => (next === undefined ? _prev ?? [] : next),
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
    reducer: (_prev, next) => (next === undefined ? _prev ?? null : next),
    default: () => null,
  }),
  profile: Annotation<WorkProfile>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PROFILE,
    default: () => EMPTY_WORK_PROFILE,
  }),
  blueprint: Annotation<WorkBlueprint>({
    reducer: (prev, next) => {
      if (next === undefined) return prev ?? EMPTY_WORK_BLUEPRINT;
      return mergeBlueprintState(prev, next);
    },
    default: () => EMPTY_WORK_BLUEPRINT,
  }),
  plan: Annotation<WorkProductionPlan>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PRODUCTION_PLAN,
    default: () => EMPTY_WORK_PRODUCTION_PLAN,
  }),
  openingNextStepSuggestions: Annotation<BriefSuggestions | null>({
    reducer: (_prev, next) => (next === undefined ? _prev : next),
    default: () => null,
  }),
  turnNextStepSuggestions: Annotation<BriefSuggestions | null>({
    reducer: (_prev, next) => (next === undefined ? _prev : next),
    default: () => null,
  }),
  draft: Annotation<WorkDraft | null>({
    reducer: (_prev, next) => (next === undefined ? null : next),
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
