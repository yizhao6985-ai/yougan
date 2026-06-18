/**
 * LangGraph 运行时状态定义。
 *
 * - **state 顶层**（profile / references / production）：turn.committed 后落库
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
  EMPTY_WORK_PRODUCTION,
  EMPTY_WORK_REFERENCES,
  EMPTY_TURN_RUNTIME,
  mergeProfileState,
  mergeReferencesState,
  mergeTurnRuntime,
  EMPTY_RUN_METERING,
  type RunMetering,
  type RunProgress,
  type NextStepSuggestions,
  type TurnRuntime,
  type WorkProduction,
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
  /** API 注入：对话标题（占位「对话 N」时由 API 用首条用户消息自动替换） */
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
  /** state 顶层：制作环节（计划 + 预览） */
  production: Annotation<WorkProduction>({
    reducer: (prev: WorkProduction, next: WorkProduction | undefined) =>
      next ?? EMPTY_WORK_PRODUCTION,
    default: () => EMPTY_WORK_PRODUCTION,
  }),
  /** suggestions 子图每轮写入的下一步建议（运行时字段，不入库） */
  nextStepSuggestions: Annotation<NextStepSuggestions | null>({
    reducer: (
      prev: NextStepSuggestions | null,
      next: NextStepSuggestions | null | undefined,
    ) => (next === undefined ? (prev ?? null) : next),
    default: () => null,
  }),
  /** 对话历史滚动摘要（checkpoint 内压缩更早 messages，供后续 LLM 注入） */
  conversationSummary: Annotation<string | null>({
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
  /** API 注入：本周期额度是否已满（含 thread 内待结算 runMetering） */
  usageExceeded: Annotation<boolean>({
    reducer: (_prev: boolean, next: boolean | undefined) => next ?? false,
    default: () => false,
  }),
  /** 待结算 LLM 计量；finalizeRunMetering 合并写入，API settle 后清空 */
  runMetering: Annotation<RunMetering>({
    reducer: (prev: RunMetering, next: RunMetering | undefined) => {
      if (next === undefined) return prev ?? EMPTY_RUN_METERING;
      return next;
    },
    default: () => EMPTY_RUN_METERING,
  }),
  /** 前端可调；子图 LLM 经 getModelTemperature 读取 */
  modelTemperature: Annotation<number>({
    reducer: (prev: number, next: number | undefined) => {
      if (next === undefined) return prev ?? env.llmTemperature;
      return Math.min(1, Math.max(0.1, Math.round(next * 10) / 10));
    },
    default: () => env.llmTemperature,
  }),
  /** 运行进度（SSE 展示 + 心跳；回合结束清空） */
  runProgress: Annotation<RunProgress | null>({
    reducer: (
      prev: RunProgress | null,
      next: RunProgress | null | undefined,
    ) => (next === undefined ? (prev ?? null) : next),
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;

/** 图节点返回的 state 增量（turn 通道为浅合并 patch，非完整 TurnRuntime） */
export type AgentStatePatch = Partial<Omit<AgentStateType, "turn">> & {
  turn?: Partial<TurnRuntime>;
};
