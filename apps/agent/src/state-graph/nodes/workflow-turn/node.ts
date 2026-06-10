import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import type { TurnQueueKind } from "@yougan/domain";

import { sortTurnQueue } from "./helpers/sort-turn-queue.js";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getHumanMessageContents,
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import {
  initPendingTurn,
  normalizeDirtyTurnState,
  patchTurn,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildTurnQueuePrompt } from "./prompt.js";
import { TurnQueueDecisionSchema, type TurnQueueDecision } from "./schema.js";

const DEFAULT_QUEUE: TurnQueueKind[] = ["profile"];

/**
 * 合并模型队列与 reference 子图入队规则：
 * - 无附件：原样返回（reference 仅当模型判定为删/改参考素材时才会出现）
 * - 有附件且队列已含 reference：原样返回，避免重复
 * - 有附件且纯 ask：不前置 reference（纯讨论不入库）
 * - 有附件且非纯 ask：确定性前置 reference，供 analyze-new-assets 分析新附件
 */
function withReferenceQueue(
  queue: TurnQueueKind[],
  hasAttachments: boolean,
): TurnQueueKind[] {
  const sorted = sortTurnQueue(queue);
  const base = sorted.length ? sorted : DEFAULT_QUEUE;
  if (!hasAttachments || base.includes("reference")) return base;

  const askOnly = base.length === 1 && base[0] === "ask";
  if (askOnly) return base;

  return sortTurnQueue(["reference", ...base]);
}

async function resolveTurnQueue(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<TurnQueueKind[]> {
  if (getHumanMessageContents(state.messages).length < 1) {
    return DEFAULT_QUEUE;
  }

  const userMessage = getLatestHumanMessageText(state.messages);
  const hasAttachments =
    getLatestHumanMessageAttachments(state.messages).length > 0;
  if (!userMessage && !hasAttachments) {
    return DEFAULT_QUEUE;
  }

  const llm = createChatModel({ temperature: 0.1 });
  const prompt = buildTurnQueuePrompt(state, userMessage);

  try {
    const parsed = (await invokeStructured(
      llm,
      TurnQueueDecisionSchema,
      [new HumanMessage(prompt)],
      { name: "turn_queue_decision" },
      config,
    )) as TurnQueueDecision;
    const queue = sortTurnQueue(parsed.kinds);
    return withReferenceQueue(
      queue.length ? queue : DEFAULT_QUEUE,
      hasAttachments,
    );
  } catch {
    return withReferenceQueue(DEFAULT_QUEUE, hasAttachments);
  }
}

/** workflowTurn：归一化脏回合 → 解析 queue → fork turn.staging */
export async function workflowTurnNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const normalized = normalizeDirtyTurnState(state);
  const baseState = normalized?.turn
    ? { ...state, turn: normalized.turn }
    : state;

  const queue = await resolveTurnQueue(baseState, config);
  const staging = initPendingTurn(baseState, queue);

  return {
    ...(normalized ?? {}),
    nextStepSuggestions: null,
    generatedConversationTitle: null,
    ...patchTurn(baseState, {
      queue,
      staging,
      completedKinds: [],
      activeKind: null,
      committed: false,
      cancelled: false,
    }),
  };
}
