/**
 * LangGraph 运行时状态定义。
 *
 * 作品级长记忆（单线 revision 物化，持久化为 WorkRevision.snapshot）：
 *   profile  → Work.profile
 *   brief    → Work.brief
 *   plan     → Work.plan
 *   draft    → Work.draft
 */
import {
  Annotation,
  MessagesAnnotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import {
  EMPTY_WORK_BRIEF,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
  mergeBriefState,
  type BriefSuggestions,
  type ChatMode,
  type WorkBrief,
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
  mode: Annotation<ChatMode>({
    reducer: (prev, next) => next ?? prev ?? "inspiration",
    default: () => "inspiration",
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
  plan: Annotation<WorkProductionPlan>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_PRODUCTION_PLAN,
    default: () => EMPTY_WORK_PRODUCTION_PLAN,
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
