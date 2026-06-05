import { useMemo } from "react";

import { normalizeNextStepSuggestions } from "@yougan/domain";
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
    return normalizeNextStepSuggestions(input.values?.nextStepSuggestions);
  }, [input.isLoading, input.values?.nextStepSuggestions]);

  return { activeSuggestions };
}
