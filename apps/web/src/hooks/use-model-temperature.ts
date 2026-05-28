import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_MODEL_TEMPERATURE_LEVEL,
  levelToTemperature,
  readStoredTemperatureLevel,
  writeStoredTemperatureLevel,
} from "@/lib/model-temperature";

export function useModelTemperature(workId: string | null | undefined) {
  const [level, setLevel] = useState(DEFAULT_MODEL_TEMPERATURE_LEVEL);

  useEffect(() => {
    if (!workId) {
      setLevel(DEFAULT_MODEL_TEMPERATURE_LEVEL);
      return;
    }
    setLevel(readStoredTemperatureLevel(workId));
  }, [workId]);

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
