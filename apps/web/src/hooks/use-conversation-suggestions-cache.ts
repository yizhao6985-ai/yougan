import { useCallback, useRef } from "react";

import type { NextStepSuggestions } from "@/lib/types";

function cacheKey(workId: string, conversationId: string) {
  return `${workId}:${conversationId}`;
}

function hasSuggestions(value: NextStepSuggestions | null | undefined) {
  return (value?.suggestions?.length ?? 0) > 0;
}

/** 按 work + conversation 缓存 nextStepSuggestions，切换对话时保留、同对话内复用 */
export function useConversationSuggestionsCache() {
  const cacheRef = useRef(new Map<string, NextStepSuggestions>());

  const get = useCallback(
    (workId: string | null, conversationId: string | null) => {
      if (!workId || !conversationId) return null;
      return cacheRef.current.get(cacheKey(workId, conversationId)) ?? null;
    },
    [],
  );

  const set = useCallback(
    (workId: string, conversationId: string, suggestions: NextStepSuggestions) => {
      if (!hasSuggestions(suggestions)) return;
      cacheRef.current.set(cacheKey(workId, conversationId), suggestions);
    },
    [],
  );

  const clear = useCallback((workId: string, conversationId: string) => {
    cacheRef.current.delete(cacheKey(workId, conversationId));
  }, []);

  const has = useCallback(
    (workId: string | null, conversationId: string | null) => {
      return hasSuggestions(get(workId, conversationId));
    },
    [get],
  );

  return { get, set, clear, has };
}

export type ConversationSuggestionsCache = ReturnType<
  typeof useConversationSuggestionsCache
>;
