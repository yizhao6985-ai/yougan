import { useMemo } from "react";

import { isTurnInFlight } from "@/lib/turn-lifecycle";
import type { YouganValues } from "@/lib/types";

function hasSuggestions(value: YouganValues["nextStepSuggestions"] | undefined) {
  return (value?.suggestions?.length ?? 0) > 0;
}

/** 验收通过后生成的下一步建议（开屏或回合末） */
export function useTurnNextStepSuggestions(input: {
  values?: YouganValues | null;
  isLoading: boolean;
}) {
  const activeSuggestions = useMemo(() => {
    const suggestions = input.values?.nextStepSuggestions ?? null;
    if (!hasSuggestions(suggestions)) return null;
    /** 主流程执行中不展示上一轮残留 suggestions（commit 后生成阶段除外） */
    if (input.isLoading && isTurnInFlight(input.values)) {
      return null;
    }
    if (input.isLoading && !suggestions) {
      return null;
    }
    return suggestions;
  }, [input.isLoading, input.values]);

  return { activeSuggestions };
}
