import { useMemo } from "react";

import { normalizeBriefSuggestions } from "@/lib/brief-ui-spec";
import type { ChatMode, YouganValues } from "@/lib/types";

export function useBriefSuggestions(
  mode: ChatMode,
  input: {
    values?: YouganValues | null;
    isLoading: boolean;
  },
) {
  const activeSuggestions = useMemo(() => {
    if (mode !== "inspiration" || input.isLoading) return null;
    return normalizeBriefSuggestions(input.values?.briefSuggestions);
  }, [input.isLoading, input.values?.briefSuggestions, mode]);

  return { activeSuggestions };
}
