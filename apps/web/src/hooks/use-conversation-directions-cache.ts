import { useCallback, useRef } from "react";

import type { TurnDirections } from "@/lib/types";

function cacheKey(workId: string, conversationId: string) {
  return `${workId}:${conversationId}`;
}

function hasDirections(value: TurnDirections | null | undefined) {
  return (value?.directions.length ?? 0) > 0;
}

/** 按 work + conversation 缓存 turnDirections，切换对话时保留、同对话内复用 */
export function useConversationDirectionsCache() {
  const cacheRef = useRef(new Map<string, TurnDirections>());

  const get = useCallback(
    (workId: string | null, conversationId: string | null) => {
      if (!workId || !conversationId) return null;
      return cacheRef.current.get(cacheKey(workId, conversationId)) ?? null;
    },
    [],
  );

  const set = useCallback(
    (workId: string, conversationId: string, directions: TurnDirections) => {
      if (!hasDirections(directions)) return;
      cacheRef.current.set(cacheKey(workId, conversationId), directions);
    },
    [],
  );

  const clear = useCallback((workId: string, conversationId: string) => {
    cacheRef.current.delete(cacheKey(workId, conversationId));
  }, []);

  const has = useCallback(
    (workId: string | null, conversationId: string | null) => {
      return hasDirections(get(workId, conversationId));
    },
    [get],
  );

  return { get, set, clear, has };
}

export type ConversationDirectionsCache = ReturnType<
  typeof useConversationDirectionsCache
>;
