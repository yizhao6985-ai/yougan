import { useMemo } from "react";

import { normalizeInspirationSuggestions } from "@/lib/inspiration-ui-spec";
import type { ChatMode, YouganValues } from "@/lib/types";

type StreamLike = {
  values?: YouganValues | null;
  isLoading: boolean;
};

/** 灵感模式建议：读取 Agent 结构化写入的 inspirationSuggestions */
export function useInspirationSuggestions(mode: ChatMode, stream: StreamLike) {
  const activeSuggestions = useMemo(() => {
    if (mode !== "inspiration" || stream.isLoading) return null;
    return normalizeInspirationSuggestions(
      stream.values?.inspirationSuggestions ?? stream.values?.inspirationChoices,
    );
  }, [
    mode,
    stream.isLoading,
    stream.values?.inspirationSuggestions,
    stream.values?.inspirationChoices,
  ]);

  return { activeSuggestions };
}

/** @deprecated 使用 useInspirationSuggestions */
export function useInspirationChoices(mode: ChatMode, stream: StreamLike) {
  const { activeSuggestions } = useInspirationSuggestions(mode, stream);
  if (!activeSuggestions) return { activeChoices: null };
  return {
    activeChoices: {
      hint: activeSuggestions.hint,
      options: activeSuggestions.suggestions.map((s) => ({
        description: s.message,
        letter: s.label,
      })),
    },
  };
}
