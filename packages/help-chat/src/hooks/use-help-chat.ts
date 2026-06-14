import { HttpAgent, randomUUID } from "@ag-ui/client";
import { useCallback, useEffect, useRef, useState } from "react";

import { useHelpChatConfig } from "../context/help-chat-config";
import type { HelpChatMessage, RagSource } from "../types";

const THREAD_STORAGE_KEY = "yougan:help-chat:thread-id";

function readThreadId() {
  if (typeof sessionStorage === "undefined") return randomUUID();
  const stored = sessionStorage.getItem(THREAD_STORAGE_KEY);
  if (stored) return stored;
  const next = randomUUID();
  sessionStorage.setItem(THREAD_STORAGE_KEY, next);
  return next;
}

function createAgent(
  apiUrl: string,
  threadId: string,
  getHeaders?: () => Record<string, string> | undefined,
) {
  return new HttpAgent({
    url: apiUrl,
    threadId,
    headers: getHeaders?.(),
  });
}

export function useHelpChat() {
  const { apiUrl, getHeaders, errorMessage } = useHelpChatConfig();
  const threadIdRef = useRef(readThreadId());
  const agentRef = useRef<HttpAgent | null>(null);
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    agentRef.current = createAgent(apiUrl, threadIdRef.current, getHeaders);
  }, [apiUrl, getHeaders]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return false;

      const agent =
        agentRef.current ??
        createAgent(apiUrl, threadIdRef.current, getHeaders);
      agentRef.current = agent;

      const userMessage: HelpChatMessage = {
        id: randomUUID(),
        role: "user",
        content: trimmed,
      };

      setMessages((current) => [...current, userMessage]);
      setError(null);
      setIsStreaming(true);

      agent.messages.push({
        id: userMessage.id,
        role: "user",
        content: trimmed,
      });

      let assistantId = randomUUID();
      let assistantContent = "";
      let assistantSources: RagSource[] | undefined;

      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          streaming: true,
        },
      ]);

      try {
        await agent.runAgent(
          { runId: randomUUID() },
          {
            onTextMessageStartEvent({ event }) {
              assistantId = event.messageId;
              assistantContent = "";
              setMessages((current) => {
                const withoutPlaceholder = current.filter(
                  (message) =>
                    !(
                      message.role === "assistant" &&
                      message.streaming &&
                      !message.content
                    ),
                );
                const existing = withoutPlaceholder.find(
                  (message) => message.id === assistantId,
                );
                if (existing) return withoutPlaceholder;
                return [
                  ...withoutPlaceholder,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: "",
                    streaming: true,
                    sources: assistantSources,
                  },
                ];
              });
            },
            onTextMessageContentEvent({ event }) {
              assistantContent += event.delta;
              setMessages((current) =>
                current.map((message) =>
                  message.id === event.messageId
                    ? {
                        ...message,
                        content: assistantContent,
                        streaming: true,
                        sources: assistantSources,
                      }
                    : message,
                ),
              );
            },
            onTextMessageEndEvent({ event }) {
              setMessages((current) =>
                current.map((message) =>
                  message.id === event.messageId
                    ? {
                        ...message,
                        content: assistantContent || message.content,
                        streaming: false,
                        sources: assistantSources,
                      }
                    : message,
                ),
              );
            },
            onCustomEvent({ event }) {
              if (event.name !== "rag_sources") return;
              assistantSources = event.value as RagSource[];
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? { ...message, sources: assistantSources }
                    : message,
                ),
              );
            },
            onRunErrorEvent() {
              throw new Error("run failed");
            },
          },
        );
      } catch {
        setError(errorMessage ?? "发送失败，请稍后重试。");
        setMessages((current) => {
          const next = current.filter(
            (message) =>
              !(
                message.role === "assistant" &&
                message.streaming &&
                !message.content
              ),
          );
          return [
            ...next,
            {
              id: randomUUID(),
              role: "assistant",
              content: errorMessage ?? "发送失败，请稍后重试。",
              error: true,
            },
          ];
        });
      } finally {
        setIsStreaming(false);
      }

      return true;
    },
    [apiUrl, errorMessage, getHeaders, isStreaming],
  );

  const resetConversation = useCallback(() => {
    threadIdRef.current = randomUUID();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(THREAD_STORAGE_KEY, threadIdRef.current);
    }
    agentRef.current = createAgent(apiUrl, threadIdRef.current, getHeaders);
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, [apiUrl, getHeaders]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    resetConversation,
  };
}
