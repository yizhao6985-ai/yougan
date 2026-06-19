import { useMemoizedFn } from "ahooks";
import { useEffect, useState } from "react";

import {
  DEFAULT_MODEL_TEMPERATURE_LEVEL,
  levelToTemperature,
  readStoredTemperatureLevel,
  writeStoredTemperatureLevel,
} from "@/lib/model-temperature";

export function useModelTemperature(workId: string | null | undefined) {
  const [level, setLevel] = useState(DEFAULT_MODEL_TEMPERATURE_LEVEL);

  useEffect(() => {
    setLevel(
      workId
        ? readStoredTemperatureLevel(workId)
        : DEFAULT_MODEL_TEMPERATURE_LEVEL,
    );
  }, [workId]);

  const setTemperatureLevel = useMemoizedFn((nextLevel: number) => {
    setLevel(nextLevel);
    if (workId) writeStoredTemperatureLevel(workId, nextLevel);
  });

  return {
    level,
    temperature: levelToTemperature(level),
    setTemperatureLevel,
  };
}
