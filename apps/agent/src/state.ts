/**
 * LangGraph 运行时状态定义。
 *
 * 与数据库 Work 表 JSON 字段的对应关系：
 *   profile     → Work.profile
 *   outline     → Work.outline
 *   inspiration → Work.inspiration
 *   creation    → Work.creation
 *   inspirationChoices → 仅运行时，流式传给前端，不持久化
 *
 * 前端/API 在每次 stream run 前注入完整 work 上下文；run 结束后
 * syncFromStream 把 values 写回数据库。
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
  EMPTY_WORK_OUTLINE,
  EMPTY_WORK_PROFILE,
  type ChatMode,
  type GeneratedContent,
  type InspirationChoices,
  type WorkInspiration,
  type WorkOutline,
  type WorkProfile,
} from "./schemas.js";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  /** 当前创作模式：inspiration | outline | creation */
  mode: Annotation<ChatMode>({
    reducer: (_prev, next) => next ?? "inspiration",
    default: () => "inspiration",
  }),
  /** 对应 Work.id / API workId */
  workId: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  profile: Annotation<WorkProfile>({
    /** 作品创作特征；大纲/创作模式通过 update_work_profile 更新 */
    reducer: (_prev, next) => next ?? EMPTY_WORK_PROFILE,
    default: () => EMPTY_WORK_PROFILE,
  }),
  /** 大纲模式 JSON，对应 Work.outline */
  outline: Annotation<WorkOutline>({
    reducer: (_prev, next) => next ?? EMPTY_WORK_OUTLINE,
    default: () => EMPTY_WORK_OUTLINE,
  }),
  /** 灵感模式 JSON，对应 Work.inspiration */
  inspiration: Annotation<WorkInspiration>({
    /**
     * 合并策略：防止大纲/创作回合用空对象覆盖已定稿灵感。
     * undefined → 保留 prev；显式更新 → mergeInspirationState。
     */
    reducer: (prev, next) => {
      if (next === undefined) return prev ?? EMPTY_WORK_INSPIRATION;
      return mergeInspirationState(prev, next);
    },
    default: () => EMPTY_WORK_INSPIRATION,
  }),
  /** 灵感模式结构化选项，不入库 */
  inspirationChoices: Annotation<InspirationChoices | null>({
    /** undefined 表示本回合未更新，保留上一轮选项 */
    reducer: (_prev, next) => (next === undefined ? _prev : next),
    default: () => null,
  }),
  /** createReactAgent responseFormat 写入；apply 后清空，不入库 */
  structuredResponse: Annotation<unknown>({
    reducer: (_prev, next) => (next === undefined ? _prev : next),
    default: () => undefined,
  }),
  /** 创作模式产出，对应 Work.creation */
  creation: Annotation<GeneratedContent | null>({
    reducer: (_prev, next) => (next === undefined ? null : next),
    default: () => null,
  }),
  /** 主对话模型温度（0.1–1.0），由前端创意度滑条控制 */
  modelTemperature: Annotation<number>({
    reducer: (_prev, next) => {
      if (next === undefined) return _prev ?? env.minimaxTemperature;
      return Math.min(1, Math.max(0.1, Math.round(next * 10) / 10));
    },
    default: () => env.minimaxTemperature,
  }),
});

export type AgentStateType = typeof AgentState.State;

/** 安全读取 state 字段的辅助函数，避免各处重复 ?? EMPTY_* */
export function parseProfile(state: AgentStateType): WorkProfile {
  return state.profile ?? EMPTY_WORK_PROFILE;
}

export function parseOutline(state: AgentStateType): WorkOutline {
  return state.outline ?? EMPTY_WORK_OUTLINE;
}

/** @deprecated 使用 parseOutline */
export function parsePlan(state: AgentStateType): WorkOutline {
  return parseOutline(state);
}

export function parseInspiration(state: AgentStateType): WorkInspiration {
  return state.inspiration ?? EMPTY_WORK_INSPIRATION;
}

export function parseMode(state: AgentStateType): ChatMode {
  return state.mode ?? "inspiration";
}

export function parseModelTemperature(state: AgentStateType): number {
  const value = state.modelTemperature;
  if (value == null || Number.isNaN(value)) {
    return env.minimaxTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(value * 10) / 10));
}
