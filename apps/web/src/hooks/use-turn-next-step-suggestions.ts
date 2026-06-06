import { useMemo } from "react";

import type { YouganValues } from "@/lib/types";

/** 验收通过后生成的下一步建议（开屏或回合末） */
export function useTurnNextStepSuggestions(input: {
  values?: YouganValues | null;
  isLoading: boolean;
}) {
  const activeSuggestions = useMemo(() => {
    if (input.isLoading) {
      return null;
    }
    return input.values?.nextStepSuggestions ?? null;
  }, [input.isLoading, input.values?.nextStepSuggestions]);

  return { activeSuggestions };
}
