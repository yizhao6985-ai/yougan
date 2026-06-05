import { HumanMessage } from "@langchain/core/messages";

import { sortTurnQueue, type TurnQueueKind } from "@yougan/domain";

import { createStructuredModel } from "#agent/model/dashscope.js";
import { invokeStructuredOutput } from "#agent/llm/structured-output.js";
import {
  countHumanMessages,
  getLatestHumanMessageImageUrls,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { initStagingForTurn } from "#agent/runtime/staging-writes.js";
import type { AgentStateType } from "#agent/state.js";

import { buildTurnQueuePrompt } from "./prompt.js";
import { TurnQueueDecisionSchema, type TurnQueueDecision } from "./schema.js";

const DEFAULT_QUEUE: TurnQueueKind[] = ["profile"];

async function resolveTurnQueue(
  state: AgentStateType,
): Promise<TurnQueueKind[]> {
  if (countHumanMessages(state.messages) < 1) {
    return DEFAULT_QUEUE;
  }

  const userMessage = getLatestHumanMessageText(state.messages);
  const hasImages = getLatestHumanMessageImageUrls(state.messages).length > 0;
  if (!userMessage && !hasImages) {
    return DEFAULT_QUEUE;
  }

  const llm = createStructuredModel({ temperature: 0.1 });
  const prompt = buildTurnQueuePrompt(state, userMessage);

  try {
    const parsed = (await invokeStructuredOutput(
      llm,
      TurnQueueDecisionSchema,
      [new HumanMessage(prompt)],
      { name: "turn_queue_decision" },
    )) as TurnQueueDecision;
    const queue = sortTurnQueue(parsed.kinds);
    return queue.length ? queue : DEFAULT_QUEUE;
  } catch {
    return DEFAULT_QUEUE;
  }
}

/** 编排本轮：解析 turnQueue 并 fork staging 工作区 */
export async function orchestrateTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const turnQueue = await resolveTurnQueue(state);
  const staging = initStagingForTurn(state, turnQueue);

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
