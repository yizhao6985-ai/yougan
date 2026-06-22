import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  sanitizeBriefingExcerpt,
  TURN_BRIEFING_AI_MESSAGE_KIND,
} from "@yougan/domain";

import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { messageContentToText } from "#agent/messages/message-content.js";
import { getLatestHumanMessageId } from "#agent/messages/human.js";
import { composeSystemPrompt } from "#agent/system-prompt.js";
import type { AgentStateType } from "#agent/state.js";

import {
  buildTurnBriefingFallback,
  shouldComposeTurnBriefing,
} from "./helpers/build-briefing-fallback.js";
import { turnBriefingMessageId } from "./helpers/briefing-message-id.js";
import { buildComposeTurnBriefingPrompt } from "./prompt.js";

const COMPOSE_BRIEFING_SYSTEM = composeSystemPrompt(
  "当前任务：撰写回合简报。上半段评鉴上一步对作品/方案的实际效果；下半段逐条说明已生成的延伸方向会带来什么，与下方 chips 一一对应。直接输出自然中文，两段之间空一行；不要 JSON。",
);

function buildBriefingAiMessage(
  messageId: string,
  body: string,
  excerpt: string | null,
): AIMessage {
  const sanitizedExcerpt = sanitizeBriefingExcerpt(excerpt);
  return new AIMessage({
    id: messageId,
    content: body.trim(),
    additional_kwargs: {
      yougan_message_kind: TURN_BRIEFING_AI_MESSAGE_KIND,
      ...(sanitizedExcerpt
        ? { turn_briefing_excerpt: sanitizedExcerpt }
        : {}),
    },
  });
}

function buildFallbackBriefingBody(
  fallback: NonNullable<ReturnType<typeof buildTurnBriefingFallback>>,
  state: AgentStateType,
): string {
  const directions = state.turnDirections?.directions ?? [];
  const directionBlock =
    directions.length > 0
      ? directions
          .map((direction) => `· ${direction.label}：${direction.outcome}`)
          .join("\n")
      : "";

  if (!directionBlock) {
    return fallback.effectSummary;
  }

  return `${fallback.effectSummary}\n\n${directionBlock}`;
}

/** 流式撰写回合简报；失败时回退规则模板 */
export async function resolveTurnBriefingMessage(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AIMessage | null> {
  const hasDirections = (state.turnDirections?.directions.length ?? 0) > 0;
  if (!shouldComposeTurnBriefing(state) && !hasDirections) {
    return null;
  }

  const fallback = buildTurnBriefingFallback(state);
  const humanMessageId = getLatestHumanMessageId(state.messages);
  const messageId =
    humanMessageId != null
      ? turnBriefingMessageId(humanMessageId)
      : `turn-briefing-${Date.now()}`;

  const streamKwargs: Record<string, unknown> = {
    yougan_message_kind: TURN_BRIEFING_AI_MESSAGE_KIND,
  };
  const fallbackExcerpt = sanitizeBriefingExcerpt(fallback?.excerpt);
  if (fallbackExcerpt) {
    streamKwargs.turn_briefing_excerpt = fallbackExcerpt;
  }

  try {
    const response = await streamChat(
      createChatModel({ temperature: 0.2 }),
      [
        new SystemMessage(COMPOSE_BRIEFING_SYSTEM),
        new HumanMessage(buildComposeTurnBriefingPrompt(state)),
      ],
      config ?? {},
      {
        messageId,
        additionalKwargs: streamKwargs,
      },
    );

    const body = messageContentToText(response.content).trim();
    if (!body) {
      if (!fallback) return null;
      return buildBriefingAiMessage(
        messageId,
        buildFallbackBriefingBody(fallback, state),
        fallback.excerpt,
      );
    }

    return buildBriefingAiMessage(messageId, body, fallback?.excerpt ?? null);
  } catch {
    if (!fallback) return null;
    return buildBriefingAiMessage(
      messageId,
      buildFallbackBriefingBody(fallback, state),
      fallback.excerpt,
    );
  }
}
