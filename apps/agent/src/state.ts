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
  EMPTY_WORK_BRIEF,
  EMPTY_WORK_OUTLINE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  mergeBriefState,
  mergeOutlineState,
  type BriefSuggestions,
  type TurnTaskKind,
  type WorkBrief,
  type WorkDraft,
  type WorkOutline,
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
  /** 本轮待执行任务队列（队首为当前/下一项） */
  turnTaskQueue: Annotation<TurnTaskKind[]>({
    reducer: (_prev, next) => (next === undefined ? _prev ?? [] : next),
    default: () => [],
  }),
  /** 当前正在执行的任务 */
  activeTurnTask: Annotation<TurnTaskKind | null>({
    reducer: (_prev, next) => (next === undefined ? _prev ?? null : next),
    default: () => null,
  }),
  /** 本轮已完成任务（用于回合末建议等） */
  completedTurnTasks: Annotation<TurnTaskKind[]>({
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
  profile: Annotation<WorkProfile>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PROFILE,
    default: () => EMPTY_WORK_PROFILE,
  }),
  brief: Annotation<WorkBrief>({
    reducer: (prev, next) => {
      if (next === undefined) return prev ?? EMPTY_WORK_BRIEF;
      return mergeBriefState(prev, next);
    },
    default: () => EMPTY_WORK_BRIEF,
  }),
  outline: Annotation<WorkOutline>({
    reducer: (prev, next) => {
      if (next === undefined) return prev ?? EMPTY_WORK_OUTLINE;
      return mergeOutlineState(prev, next);
    },
    default: () => EMPTY_WORK_OUTLINE,
  }),
  plan: Annotation<WorkProductionPlan>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PRODUCTION_PLAN,
    default: () => EMPTY_WORK_PRODUCTION_PLAN,
  }),
  openingBriefSuggestions: Annotation<BriefSuggestions | null>({
    reducer: (_prev, next) => (next === undefined ? _prev : next),
    default: () => null,
  }),
  briefSuggestions: Annotation<BriefSuggestions | null>({
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
