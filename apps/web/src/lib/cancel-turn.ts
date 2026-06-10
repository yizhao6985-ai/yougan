import type { Message } from "@langchain/langgraph-sdk";
import { mergeTurnRuntime, EMPTY_TURN_RUNTIME } from "@yougan/domain";

import type { YouganValues } from "@/lib/types";

function findLastHumanIndex(messages: Message[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.type === "human") return i;
  }
  return -1;
}

/** 本轮用户消息之后产生的 assistant 消息（含 tool 父消息）视为可中断。 */
export function collectInterruptibleMessageIds(messages: Message[]): string[] {
  const lastHumanIndex = findLastHumanIndex(messages);
  if (lastHumanIndex < 0) return [];

  const ids: string[] = [];
  for (let i = lastHumanIndex + 1; i < messages.length; i += 1) {
    const message = messages[i];
    if (message?.type === "ai" && message.id) {
      ids.push(message.id);
    }
  }
  return ids;
}

export function buildTurnCancelPatch(
  prev: YouganValues | null | undefined,
  messages: Message[],
): Pick<YouganValues, "turn"> {
  const prevIds = prev?.turn?.interruptedMessageIds ?? [];
  const newIds = collectInterruptibleMessageIds(messages);
  const base = mergeTurnRuntime(EMPTY_TURN_RUNTIME, prev?.turn ?? {});

  return {
    turn: mergeTurnRuntime(base, {
      staging: null,
      committed: false,
      cancelled: true,
      interruptedMessageIds: [...new Set([...prevIds, ...newIds])],
    }),
  };
}
