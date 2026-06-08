import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { sortTurnQueue, type TurnQueueKind } from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getHumanMessageContents,
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { initPendingTurn } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildTurnQueuePrompt } from "./prompt.js";
import { TurnQueueDecisionSchema, type TurnQueueDecision } from "./schema.js";

const DEFAULT_QUEUE: TurnQueueKind[] = ["profile"];

function withReferenceQueue(
  queue: TurnQueueKind[],
  hasAttachments: boolean,
): TurnQueueKind[] {
  const sorted = sortTurnQueue(queue);
  const base = sorted.length ? sorted : DEFAULT_QUEUE;
  if (!hasAttachments || base.includes("reference")) return base;

  const askOnly =
    base.length === 1 && base[0] === "ask";
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

/** 编排本轮：解析 turnQueue 并 fork staging 工作区 */
export async function orchestrateTurnNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const turnQueue = await resolveTurnQueue(state, config);
  const staging = initPendingTurn(state, turnQueue);

  return {
    turnQueue,
    /** 新回合开始：清掉上一轮 verifyTurn 产出的建议与标题建议 */
    suggestedConversationTitle: null,
    nextStepSuggestions: null,
    completedTurnKinds: [],
    activeTurnKind: null,
    staging,
    turnCancelled: false,
    turnCommitted: false,
  };
}
