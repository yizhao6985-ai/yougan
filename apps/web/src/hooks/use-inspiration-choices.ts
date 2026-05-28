import { useMemo } from "react";

import { normalizeInspirationChoices } from "@/lib/inspiration-ui-spec";
import type { ChatMode, YouganValues } from "@/lib/types";

type StreamLike = {
  values?: YouganValues | null;
  isLoading: boolean;
};

/** 灵感模式选项：只读 Agent 结构化写入的 inspirationChoices */
export function useInspirationChoices(mode: ChatMode, stream: StreamLike) {
  const activeChoices = useMemo(() => {
    if (mode !== "inspiration" || stream.isLoading) return null;
    return normalizeInspirationChoices(stream.values?.inspirationChoices);
  }, [mode, stream.isLoading, stream.values?.inspirationChoices]);

  return { activeChoices };
}
