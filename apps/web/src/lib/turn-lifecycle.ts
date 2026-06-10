import type { Message } from "@langchain/langgraph-sdk";
import { EMPTY_TURN_RUNTIME, mergeTurnRuntime } from "@yougan/domain";

import type { YouganValues } from "@/lib/types";

import { buildTurnCancelPatch } from "./cancel-turn";

/** LangGraph SDK 将活跃 run id 写入 sessionStorage 的 key 前缀 */
const LANGGRAPH_STREAM_RUN_KEY_PREFIX = "lg:stream:";

/** 新 submit 前重置的回合运行时与验收产物 */
export const TURN_EPHEMERAL_RESET: Pick<
  YouganValues,
  "turn" | "nextStepSuggestions" | "generatedConversationTitle"
> = {
  turn: { ...EMPTY_TURN_RUNTIME },
  nextStepSuggestions: null,
  generatedConversationTitle: null,
};

export function getActiveLangGraphRunId(threadId: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(`${LANGGRAPH_STREAM_RUN_KEY_PREFIX}${threadId}`);
}

/** 取消完成后写入 checkpoint 的完整回合清理 patch */
export function buildTurnFinalizePatch(
  prev: YouganValues | null | undefined,
  messages: Message[],
): Pick<
  YouganValues,
  "turn" | "nextStepSuggestions" | "generatedConversationTitle"
> {
  const { turn: cancelled } = buildTurnCancelPatch(prev, messages);
  return {
    turn: mergeTurnRuntime(cancelled ?? EMPTY_TURN_RUNTIME, {
      queue: [],
      activeKind: null,
      completedKinds: [],
    }),
    nextStepSuggestions: null,
    generatedConversationTitle: null,
  };
}
