import { HumanMessage } from "@langchain/core/messages";

import {
  fallbackConversationTitleFromText,
  sanitizeAutoConversationTitle,
  sortTurnQueue,
  type TurnQueueKind,
} from "@yougan/domain";

import { createStructuredModel } from "../../../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../../../lib/structured-output.js";
import { shouldSuggestConversationTitle } from "../../../../lib/conversation-title/should-suggest-conversation-title.js";
import {
  countHumanMessages,
  getLatestHumanMessageImageUrls,
  getLatestHumanMessageText,
} from "../../../../lib/human-message/index.js";
import type { AgentStateType } from "../../../../state.js";
import { buildTurnQueuePrompt } from "../../prompt.js";
import { TurnQueueDecisionSchema } from "../../../../schema.js";

const DEFAULT_QUEUE: TurnQueueKind[] = ["inspiration"];

export type PlanTurnQueueResult = {
  turnQueue: TurnQueueKind[];
  suggestedConversationTitle?: string;
};

/** 用大模型结构化输出解析本轮队列，并在首条用户消息时建议对话标题 */
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

  const requestTitle = shouldSuggestConversationTitle(state);
  const llm = createStructuredModel({ temperature: 0.1 });
  const prompt = buildTurnQueuePrompt(state, userMessage, {
    requestConversationTitle: requestTitle,
  });

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      TurnQueueDecisionSchema,
      [new HumanMessage(prompt)],
      { name: "turn_queue_decision" },
    );
    const queue = sortTurnQueue(parsed.kinds);
    const turnQueue = queue.length ? queue : DEFAULT_QUEUE;
    let suggestedConversationTitle = requestTitle
      ? (sanitizeAutoConversationTitle(parsed.conversationTitle) ?? undefined)
      : undefined;
    if (requestTitle && !suggestedConversationTitle) {
      const fallback =
        fallbackConversationTitleFromText(userMessage) ??
        (hasImages ? "参考图讨论" : undefined);
      suggestedConversationTitle =
        sanitizeAutoConversationTitle(fallback) ?? undefined;
    }

    return { turnQueue, suggestedConversationTitle };
  } catch {
    return { turnQueue: DEFAULT_QUEUE };
  }
}
