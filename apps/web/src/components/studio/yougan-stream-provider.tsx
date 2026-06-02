import { createContext, useCallback, useContext, type ReactNode } from "react";

import {
  useConversationsStore,
  type ConversationsStore,
} from "@/hooks/use-conversations-store";
import { useModelTemperature } from "@/hooks/use-model-temperature";
import { useInvalidateRevisionQueries } from "@/hooks/queries/revisions";
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

function ConversationStreamInner({
  worksStore,
  conversationsStore,
  children,
}: {
  worksStore: WorksStore;
  conversationsStore: ConversationsStore;
  children: ReactNode;
}) {
  const temperatureControl = useModelTemperature(worksStore.activeWork?.id);
  const invalidateRevisionQueries = useInvalidateRevisionQueries(
    worksStore.activeWork?.id ?? null,
  );

  const handleRunComplete = useCallback(
    (workId: string, values: YouganValues) => {
      worksStore.applyStreamValuesToCache(workId, values);
      void invalidateRevisionQueries();
    },
    [invalidateRevisionQueries, worksStore],
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

function StreamBridge({
  worksStore,
  children,
}: {
  worksStore: WorksStore;
  children: ReactNode;
}) {
  const conversationsStore = useConversationsStore(worksStore.activeWork?.id ?? null);
  const streamKey = [
    worksStore.activeWork?.id ?? "studio-empty",
    conversationsStore.activeConversation?.id ?? "no-conversation",
  ].join(":");

  return (
    <ConversationStreamInner
      key={streamKey}
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
