import { useMemo } from "react";

import { normalizeBriefSuggestions } from "@/lib/brief-ui-spec";
import type { YouganValues } from "@/lib/types";

/** 回合末下一步工作建议（有消息后展示） */
export function useTurnNextStepSuggestions(input: {
  values?: YouganValues | null;
  isLoading: boolean;
}) {
  const activeSuggestions = useMemo(() => {
    if (input.isLoading) {
      return null;
    }
    return normalizeBriefSuggestions(input.values?.turnNextStepSuggestions);
  }, [input.isLoading, input.values?.turnNextStepSuggestions]);

  return { activeSuggestions };
}
