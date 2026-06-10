import { createContext, useCallback, useContext, type ReactNode } from "react";

import {
  useConversationsStore,
  type ConversationsStore,
} from "@/hooks/use-conversations-store";
import { useModelTemperature } from "@/hooks/use-model-temperature";
import {
  patchConversationsCache,
  useInvalidateWorkConversations,
} from "@/hooks/queries/conversations";
import { useInvalidateVersionQueries } from "@/hooks/queries/versions";
import { useQueryClient } from "@tanstack/react-query";
import {
  countHumanCheckpointMessages,
  fallbackConversationTitleFromText,
  getFirstHumanCheckpointMessageText,
  isDefaultConversationTitle,
  sanitizeAutoConversationTitle,
} from "@yougan/domain";
import {
  useYouganStream,
  type YouganStream,
} from "@/hooks/use-yougan-stream";
import { useWorksStore, type WorksStore } from "@/hooks/use-works-store";
import type { YouganValues } from "@/lib/types";

type StudioContextValue = WorksStore &
  ConversationsStore &
  YouganStream & {
    modelTemperatureLevel: number;
    setModelTemperatureLevel: (level: number) => void;
  };

const StudioContext = createContext<StudioContextValue | null>(null);

/** 按对话 remount stream，避免切换时残留上一 thread 的 messages / loading */
function ConversationStreamKeyed({
  worksStore,
  conversationsStore,
  children,
}: {
  worksStore: WorksStore;
  conversationsStore: ConversationsStore;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const temperatureControl = useModelTemperature(worksStore.activeWork?.id);
  const workId = worksStore.activeWork?.id ?? null;
  const invalidateVersionQueries = useInvalidateVersionQueries(workId);
  const invalidateConversations = useInvalidateWorkConversations(workId);

  const handleRunComplete = useCallback(
    (completedWorkId: string, values: YouganValues) => {
      worksStore.applyStreamValuesToCache(completedWorkId, values);
      void invalidateVersionQueries();

      const conversationId = conversationsStore.activeConversation?.id;
      const activeTitle = conversationsStore.activeConversation?.title ?? "";
      const cachedTitle =
        conversationsStore.conversations.find((c) => c.id === conversationId)
          ?.title ?? activeTitle;
      const stillPlaceholderTitle =
        isDefaultConversationTitle(activeTitle) &&
        isDefaultConversationTitle(cachedTitle);

      if (!stillPlaceholderTitle || completedWorkId !== workId) return;

      let generatedTitle = sanitizeAutoConversationTitle(
        values.generatedConversationTitle,
      );
      if (!generatedTitle) {
        const firstHuman = getFirstHumanCheckpointMessageText(values.messages);
        generatedTitle = fallbackConversationTitleFromText(firstHuman);
      }
      if (conversationId && generatedTitle) {
        patchConversationsCache(queryClient, completedWorkId, (items) =>
          items.map((item) =>
            item.id === conversationId
              ? { ...item, title: generatedTitle }
              : item,
          ),
        );
      }

      // 仅占位标题且已有用户消息时拉列表，对齐 agent-proxy 自动标题（开屏 bootstrap 无 human，跳过）
      if (conversationId && countHumanCheckpointMessages(values.messages) >= 1) {
        window.setTimeout(() => {
          void invalidateConversations();
        }, 800);
      }
    },
    [
      conversationsStore.activeConversation?.id,
      invalidateConversations,
      invalidateVersionQueries,
      queryClient,
      workId,
      worksStore,
    ],
  );

  const streamState = useYouganStream({
    work: worksStore.activeWork,
    conversation: conversationsStore.activeConversation,
    modelTemperature: temperatureControl.temperature,
    onThreadId: conversationsStore.setConversationThreadId,
    onRunComplete: handleRunComplete,
  });

  const value: StudioContextValue = {
    ...worksStore,
    ...conversationsStore,
    ...streamState,
    modelTemperatureLevel: temperatureControl.level,
    setModelTemperatureLevel: temperatureControl.setTemperatureLevel,
  };

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

function ConversationStreamInner({
  worksStore,
  conversationsStore,
  children,
}: {
  worksStore: WorksStore;
  conversationsStore: ConversationsStore;
  children: ReactNode;
}) {
  const conversationKey =
    conversationsStore.activeConversation?.id ?? "__no-conversation__";

  return (
    <ConversationStreamKeyed
      key={conversationKey}
      worksStore={worksStore}
      conversationsStore={conversationsStore}
    >
      {children}
    </ConversationStreamKeyed>
  );
}

function StreamBridge({
  worksStore,
  children,
}: {
  worksStore: WorksStore;
  children: ReactNode;
}) {
  const conversationsStore = useConversationsStore(worksStore.activeWork?.id ?? null);

  return (
    <ConversationStreamInner
      worksStore={worksStore}
      conversationsStore={conversationsStore}
    >
      {children}
    </ConversationStreamInner>
  );
}

export function YouganStreamProvider({ children }: { children: ReactNode }) {
  const worksStore = useWorksStore();
  const streamKey = worksStore.activeWork?.id ?? "studio-empty";

  return (
    <StreamBridge key={streamKey} worksStore={worksStore}>
      {children}
    </StreamBridge>
  );
}

export function useYouganStreamContext() {
  const value = useContext(StudioContext);
  if (!value) {
    throw new Error(
      "useYouganStreamContext must be used within YouganStreamProvider",
    );
  }
  return value;
}
