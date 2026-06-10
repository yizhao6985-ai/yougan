import { useMemo } from "react";

import type { YouganValues } from "@/lib/types";

/** 验收通过后生成的下一步建议（开屏或回合末） */
export function useTurnNextStepSuggestions(input: {
  values?: YouganValues | null;
  isLoading: boolean;
}) {
  const activeSuggestions = useMemo(() => {
    const suggestions = input.values?.nextStepSuggestions ?? null;
    // 回合末 generateSuggestions 与 generateTitle 并行；建议先到时即可展示
    if (input.isLoading && !suggestions) {
      return null;
    }
    return suggestions;
  }, [input.isLoading, input.values?.nextStepSuggestions]);

  return { activeSuggestions };
}
