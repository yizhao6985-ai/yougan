import { useMemo } from "react";

import type { YouganValues } from "@/lib/types";

function hasTurnDirections(
  value: YouganValues["turnDirections"] | undefined,
): boolean {
  return (value?.directions.length ?? 0) > 0;
}

export function useTurnDirections(input: {
  values: YouganValues | null | undefined;
  directionsCache?: YouganValues["turnDirections"] | null;
}) {
  const activeDirections = useMemo(() => {
    const directions = input.values?.turnDirections ?? null;
    if (hasTurnDirections(directions)) return directions;
    if (hasTurnDirections(input.directionsCache ?? undefined)) {
      return input.directionsCache!;
    }
    return null;
  }, [input.directionsCache, input.values?.turnDirections]);

  return { activeDirections };
}
