/**
 * LangGraph 运行时状态定义。
 *
 * - **state 顶层**（profile / references / productionPlan / preview）：commitTurn 后落库，跨回合保留
 * - **staging**：单回合工作区，子图 tools 只写 staging，commit 前前端预览读 staging
 * - **turnQueue / activeTurnKind / completedTurnKinds**：外层回合 workflow，见 nodes/workflow-turn、dispatch-turn-queue
 * - **nextStepSuggestions**：仅 verify 节点写入；workflowTurn 新回合开始时清空
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
  mergeProfileState,
  mergeReferencesState,
  type NextStepSuggestions,
  type TurnQueueKind,
  type TurnStaging,
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
  /** 本轮待执行子图队列（队首为下一项） */
  turnQueue: Annotation<TurnQueueKind[]>({
    reducer: (prev: TurnQueueKind[], next: TurnQueueKind[] | undefined) =>
      next === undefined ? (prev ?? []) : next,
    default: () => [],
  }),
  /** 当前正在执行的队列项（dispatch 写入） */
  activeTurnKind: Annotation<TurnQueueKind | null>({
    reducer: (
      prev: TurnQueueKind | null,
      next: TurnQueueKind | null | undefined,
    ) => (next === undefined ? (prev ?? null) : next),
    default: () => null,
  }),
  /** 本轮已完成的队列项（advance 累积，verify 节点生成建议时参考） */
  completedTurnKinds: Annotation<TurnQueueKind[]>({
    reducer: (prev: TurnQueueKind[], next: TurnQueueKind[] | undefined) =>
      next === undefined ? (prev ?? []) : next,
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
  /** verify generateTitle 产出；stream 结束后 API 写入 WorkConversation.title */
  generatedConversationTitle: Annotation<string | null>({
    reducer: (prev: string | null, next: string | null | undefined) =>
      next === undefined ? (prev ?? null) : next,
    default: () => null,
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
  /** 本轮工作区 */
  staging: Annotation<TurnStaging | null>({
    reducer: (
      prev: TurnStaging | null,
      next: TurnStaging | null | undefined,
    ) => (next === undefined ? (prev ?? null) : next),
    default: () => null,
  }),
  /** turn.commit 成功后为 true，API 据此物化 Work */
  turnCommitted: Annotation<boolean>({
    reducer: (prev: boolean, next: boolean | undefined) =>
      next === undefined ? (prev ?? false) : next,
    default: () => false,
  }),
  /** 用户取消本轮：commit 跳过，staging 回滚 */
  turnCancelled: Annotation<boolean>({
    reducer: (prev: boolean, next: boolean | undefined) =>
      next === undefined ? (prev ?? false) : next,
    default: () => false,
  }),
  /** 被用户中断的 assistant 消息 id（前端 stop 写入） */
  interruptedMessageIds: Annotation<string[]>({
    reducer: (prev: string[], next: string[] | undefined) => {
      if (next === undefined) return prev ?? [];
      return [...new Set([...(prev ?? []), ...next])];
    },
    default: () => [],
  }),
  /** 验收通过后生成的下一步可点击建议（开屏 7 条 / 对话流 4 条） */
  nextStepSuggestions: Annotation<NextStepSuggestions | null>({
    reducer: (
      prev: NextStepSuggestions | null,
      next: NextStepSuggestions | null | undefined,
    ) => (next === undefined ? prev : next),
    default: () => null,
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
