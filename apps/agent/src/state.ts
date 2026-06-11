/**
 * LangGraph 运行时状态定义。
 *
 * - **state 顶层**（profile / references / productionPlan / preview）：turn.committed 后落库
 * - **turn**：单轮执行运行时（调度、staging、取消）
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
  EMPTY_WORK_REFERENCES,
  EMPTY_TURN_RUNTIME,
  mergeProfileState,
  mergeReferencesState,
  mergeTurnRuntime,
  type NextStepSuggestions,
  type TurnRuntime,
  type WorkPreview,
  type WorkProductionPlan,
  type WorkProfile,
  type WorkReference,
} from "@yougan/domain";

import { env } from "./env.js";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  /** API 注入：当前作品 id */
  workId: Annotation<string | undefined>({
    reducer: (prev: string | undefined, next: string | undefined) => next,
    default: () => undefined,
  }),
  /** API 注入：作品标题 */
  workTitle: Annotation<string | undefined>({
    reducer: (prev: string | undefined, next: string | undefined) => next,
    default: () => undefined,
  }),
  /** API 注入：对话标题（占位「对话 N」时可被 generatedConversationTitle 替换） */
  conversationTitle: Annotation<string | undefined>({
    reducer: (prev: string | undefined, next: string | undefined) => next,
    default: () => undefined,
  }),
  /** state 顶层：已提交作品方案 */
  profile: Annotation<WorkProfile>({
    reducer: (prev: WorkProfile, next: WorkProfile | undefined) => {
      if (next === undefined) return prev ?? EMPTY_WORK_PROFILE;
      return mergeProfileState(prev, next);
    },
    default: () => EMPTY_WORK_PROFILE,
  }),
  /** state 顶层：已提交参考素材 */
  references: Annotation<WorkReference[]>({
    reducer: (prev: WorkReference[], next: WorkReference[] | undefined) => {
      if (next === undefined) return prev ?? [...EMPTY_WORK_REFERENCES];
      return mergeReferencesState(prev, next);
    },
    default: () => [...EMPTY_WORK_REFERENCES],
  }),
  /** state 顶层：已提交制作计划 */
  productionPlan: Annotation<WorkProductionPlan>({
    reducer: (prev: WorkProductionPlan, next: WorkProductionPlan | undefined) =>
      next ?? EMPTY_WORK_PRODUCTION_PLAN,
    default: () => EMPTY_WORK_PRODUCTION_PLAN,
  }),
  /** state 顶层：已提交作品预览 */
  preview: Annotation<WorkPreview | null>({
    reducer: (
      prev: WorkPreview | null,
      next: WorkPreview | null | undefined,
    ) => (next === undefined ? null : next),
    default: () => null,
  }),
  /** suggestions 子图每轮写入的下一步建议（运行时字段，不入库） */
  nextStepSuggestions: Annotation<NextStepSuggestions | null>({
    reducer: (
      prev: NextStepSuggestions | null,
      next: NextStepSuggestions | null | undefined,
    ) => (next === undefined ? (prev ?? null) : next),
    default: () => null,
  }),
  /** 首条用户消息后生成的对话标题建议 */
  generatedConversationTitle: Annotation<string | null>({
    reducer: (prev: string | null, next: string | null | undefined) =>
      next === undefined ? (prev ?? null) : next,
    default: () => null,
  }),
  /** 单轮执行运行时 */
  turn: Annotation<TurnRuntime>({
    reducer: (prev: TurnRuntime, next: TurnRuntime | undefined) => {
      if (next === undefined) return prev ?? EMPTY_TURN_RUNTIME;
      return mergeTurnRuntime(prev ?? EMPTY_TURN_RUNTIME, next);
    },
    default: () => EMPTY_TURN_RUNTIME,
  }),
  /** 前端可调；子图 LLM 经 getModelTemperature 读取 */
  modelTemperature: Annotation<number>({
    reducer: (prev: number, next: number | undefined) => {
      if (next === undefined) return prev ?? env.llmTemperature;
      return Math.min(1, Math.max(0.1, Math.round(next * 10) / 10));
    },
    default: () => env.llmTemperature,
  }),
});

export type AgentStateType = typeof AgentState.State;

/** 图节点返回的 state 增量（turn 通道为浅合并 patch，非完整 TurnRuntime） */
export type AgentStatePatch = Partial<Omit<AgentStateType, "turn">> & {
  turn?: Partial<TurnRuntime>;
};
