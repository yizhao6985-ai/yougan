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
  EMPTY_WORK_REVISION,
  EMPTY_TURN_RUNTIME,
  mergeProfileState,
  mergeReferencesState,
  mergeTurnRuntime,
  type AiUsageSnapshot,
  type RunProgress,
  type TurnDirections,
  type TurnRuntime,
  type WorkPreview,
  type WorkProduction,
  type WorkProfile,
  type WorkReference,
  type WorkRevision,
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
  /** API 注入：对话标题（占位「对话」时由 API 用首条用户消息自动替换） */
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
  /** state 顶层：已提交作品预览 */
  preview: Annotation<WorkPreview | null>({
    reducer: (
      prev: WorkPreview | null,
      next: WorkPreview | null | undefined,
    ) => (next === undefined ? (prev ?? null) : next),
    default: () => null,
  }),
  /** state 顶层：改稿意见清单 */
  revision: Annotation<WorkRevision>({
    reducer: (prev: WorkRevision, next: WorkRevision | undefined) =>
      next ?? prev ?? EMPTY_WORK_REVISION,
    default: () => ({ ...EMPTY_WORK_REVISION }),
  }),
  /** state 顶层：制作计划（不含 preview） */
  production: Annotation<WorkProduction>({
    reducer: (prev: WorkProduction, next: WorkProduction | undefined) =>
      next ?? EMPTY_WORK_PRODUCTION,
    default: () => EMPTY_WORK_PRODUCTION,
  }),
  /**
   * generateTurnDirections 并行写入的草稿延伸方向（运行时字段，不入库）。
   * commitTurn 再提升为 turnDirections，避免主回合进行中提前展示。
   */
  pendingTurnDirections: Annotation<TurnDirections | null>({
    reducer: (
      prev: TurnDirections | null,
      next: TurnDirections | null | undefined,
    ) => (next === undefined ? (prev ?? null) : next),
    default: () => null,
  }),
  /** commitTurn 提交后的延伸方向（运行时字段，不入库；前端读取） */
  turnDirections: Annotation<TurnDirections | null>({
    reducer: (
      prev: TurnDirections | null,
      next: TurnDirections | null | undefined,
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
  /** API 注入 + 单次 LLM 结算后更新 */
  aiUsage: Annotation<AiUsageSnapshot | undefined>({
    reducer: (
      _prev: AiUsageSnapshot | undefined,
      next: AiUsageSnapshot | undefined,
    ) => next,
    default: () => undefined,
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
