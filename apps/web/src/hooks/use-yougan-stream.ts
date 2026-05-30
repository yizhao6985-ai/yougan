import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStream } from "@langchain/langgraph-sdk/react";

import { buildHumanMessageContent } from "@/lib/build-human-message-content";
import { normalizeInspirationChoices } from "@/lib/inspiration-ui-spec";
import { YOUGAN_ASSISTANT_ID, getYouganThreadState } from "@/lib/yougan-chat-api";
import { LANGGRAPH_API_URL } from "@/lib/env";
import type { InspirationChoices } from "@/lib/types";
import type { YouganValues, Work } from "@/lib/types";
import { useAuthToken } from "@/store/auth";

const STREAM_MODES = ["messages-tuple", "updates", "values"] as const;

interface UseYouganStreamOptions {
  work: Work | null;
  modelTemperature: number;
  onThreadId?: (workId: string, threadId: string | null) => void;
  onValuesChange?: (workId: string, values: YouganValues) => void;
  onModeFromStream?: (workId: string, mode: NonNullable<YouganValues["mode"]>) => void;
}

export function useYouganStream({
  work,
  modelTemperature,
  onThreadId,
  onValuesChange,
  onModeFromStream,
}: UseYouganStreamOptions) {
  const threadId = work?.threadId ?? null;
  const workId = work?.id ?? null;
  const token = useAuthToken();

  const defaultHeaders = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workId ? { "X-Work-Id": workId } : {}),
    }),
    [token, workId],
  );

  const stream = useStream<YouganValues>({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: YOUGAN_ASSISTANT_ID,
    threadId: threadId ?? undefined,
    defaultHeaders,
    throttle: false,
    onThreadId: (id) => {
      if (workId) onThreadId?.(workId, id);
    },
  });

  const lastSyncedRef = useRef<string>("");
  const wasLoadingRef = useRef(false);
  const [threadChoices, setThreadChoices] =
    useState<InspirationChoices | null>(null);

  useEffect(() => {
    if (!workId || !stream.values) return;
    const snapshot = JSON.stringify(stream.values);
    if (snapshot === lastSyncedRef.current) return;
    lastSyncedRef.current = snapshot;
    onValuesChange?.(workId, stream.values);
  }, [onValuesChange, stream.values, workId]);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = stream.isLoading;

    if (!workId || !wasLoading || stream.isLoading || !stream.values?.mode) {
      return;
    }

    onModeFromStream?.(workId, stream.values.mode);
  }, [onModeFromStream, stream.isLoading, stream.values?.mode, workId]);

  useEffect(() => {
    if (stream.isLoading || !threadId) return;

    let cancelled = false;
    void getYouganThreadState(threadId, defaultHeaders)
      .then((state) => {
        if (cancelled) return;
        const choices = normalizeInspirationChoices(
          (state.values as YouganValues | undefined)?.inspirationChoices,
        );
        setThreadChoices(choices);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [defaultHeaders, stream.isLoading, threadId, stream.messages.length]);

  const resolvedValues = useMemo(() => {
    if (threadChoices) {
      return {
        ...(stream.values ?? {}),
        inspirationChoices: threadChoices,
      } satisfies YouganValues;
    }
    return stream.values ?? null;
  }, [stream.values, threadChoices]);

  const sendMessage = useCallback(
    async (text: string, imageUrls: string[] = []) => {
      const content = buildHumanMessageContent(text, imageUrls);
      const hasText =
        typeof content === "string" ? Boolean(content.trim()) : content.length > 0;
      if (!hasText || !work) return;

      setThreadChoices(null);

      await stream.submit(
        {
          messages: [{ type: "human" as const, content }],
          mode: work.mode,
          workId: work.id,
          profile: work.profile,
          outline: work.outline,
          inspiration: work.inspiration,
          inspirationChoices: null,
          creation: work.creation,
          modelTemperature,
        },
        {
          streamMode: [...STREAM_MODES],
        },
      );
    },
    [modelTemperature, stream, work],
  );

  return {
    stream,
    threadId,
    threadChoices,
    resolvedValues,
    sendMessage,
    canChat: Boolean(work && token),
  };
}

export type YouganStream = ReturnType<typeof useYouganStream>;
