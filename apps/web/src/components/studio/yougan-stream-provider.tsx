import { createContext, useContext, type ReactNode } from "react";

import { useModelTemperature } from "@/hooks/use-model-temperature";
import {
  useYouganStream,
  type YouganStream,
} from "@/hooks/use-yougan-stream";
import { useWorksStore, type WorksStore } from "@/hooks/use-works-store";

type StudioContextValue = WorksStore &
  YouganStream & {
    modelTemperatureLevel: number;
    setModelTemperatureLevel: (level: number) => void;
  };

const StudioContext = createContext<StudioContextValue | null>(null);

function StreamBridge({
  worksStore,
  children,
}: {
  worksStore: WorksStore;
  children: ReactNode;
}) {
  const temperatureControl = useModelTemperature(worksStore.activeWork?.id);

  const streamState = useYouganStream({
    work: worksStore.activeWork,
    modelTemperature: temperatureControl.temperature,
    onThreadId: worksStore.setWorkThreadId,
    onValuesChange: worksStore.syncFromStream,
    onModeFromStream: worksStore.syncModeFromStream,
  });

  const value: StudioContextValue = {
    ...worksStore,
    ...streamState,
    modelTemperatureLevel: temperatureControl.level,
    setModelTemperatureLevel: temperatureControl.setTemperatureLevel,
  };

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
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
