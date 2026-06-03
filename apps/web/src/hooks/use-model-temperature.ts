import { useCallback, useState } from "react";

import {
  DEFAULT_MODEL_TEMPERATURE_LEVEL,
  levelToTemperature,
  readStoredTemperatureLevel,
  writeStoredTemperatureLevel,
} from "@/lib/model-temperature";

export function useModelTemperature(workId: string | null | undefined) {
  const [level, setLevel] = useState(() =>
    workId
      ? readStoredTemperatureLevel(workId)
      : DEFAULT_MODEL_TEMPERATURE_LEVEL,
  );

  const setTemperatureLevel = useCallback(
    (nextLevel: number) => {
      setLevel(nextLevel);
      if (workId) writeStoredTemperatureLevel(workId, nextLevel);
    },
    [workId],
  );

  return {
    level,
    temperature: levelToTemperature(level),
    setTemperatureLevel,
  };
}
