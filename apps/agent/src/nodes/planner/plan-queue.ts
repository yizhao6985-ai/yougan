import { HumanMessage } from "@langchain/core/messages";

import { sortTurnQueue, type TurnQueueKind } from "@yougan/domain";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "#agent/lib/structured-output.js";
import {
  countHumanMessages,
  getLatestHumanMessageImageUrls,
  getLatestHumanMessageText,
} from "#agent/lib/human-message/index.js";
import type { AgentStateType } from "#agent/state.js";
import { buildTurnQueuePrompt } from "./prompt.js";
import { TurnQueueDecisionSchema } from "./schema.js";

const DEFAULT_QUEUE: TurnQueueKind[] = ["profile"];

export type PlanTurnQueueResult = {
  turnQueue: TurnQueueKind[];
};

/** 用大模型结构化输出解析本轮队列 */
export async function planTurnQueue(
  state: AgentStateType,
): Promise<PlanTurnQueueResult> {
  if (countHumanMessages(state.messages) < 1) {
    return { turnQueue: DEFAULT_QUEUE };
  }

  const userMessage = getLatestHumanMessageText(state.messages);
  const hasImages =
    getLatestHumanMessageImageUrls(state.messages).length > 0;
  if (!userMessage && !hasImages) {
    return { turnQueue: DEFAULT_QUEUE };
  }

  const llm = createStructuredModel({ temperature: 0.1 });
  const prompt = buildTurnQueuePrompt(state, userMessage);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      TurnQueueDecisionSchema,
      [new HumanMessage(prompt)],
      { name: "turn_queue_decision" },
    );
    const queue = sortTurnQueue(parsed.kinds);
    const turnQueue = queue.length ? queue : DEFAULT_QUEUE;

    return { turnQueue };
  } catch {
    return { turnQueue: DEFAULT_QUEUE };
  }
}
