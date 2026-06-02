import { useMemo } from "react";

import { normalizeBriefSuggestions } from "@/lib/brief-ui-spec";
import type { YouganValues } from "@/lib/types";

export function useBriefSuggestions(input: {
  values?: YouganValues | null;
  isLoading: boolean;
}) {
  const activeSuggestions = useMemo(() => {
    if (input.isLoading) {
      return null;
    }
    return normalizeBriefSuggestions(input.values?.briefSuggestions);
  }, [input.isLoading, input.values?.briefSuggestions]);

  return { activeSuggestions };
}
