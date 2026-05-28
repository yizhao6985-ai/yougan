export const MODEL_TEMPERATURE_LEVELS = 10;
export const DEFAULT_MODEL_TEMPERATURE_LEVEL = 7;
export const DEFAULT_MODEL_TEMPERATURE = 0.7;

const STORAGE_PREFIX = "yougan:model-temperature-level:";

export function levelToTemperature(level: number): number {
  const clamped = Math.min(
    MODEL_TEMPERATURE_LEVELS,
    Math.max(1, Math.round(level)),
  );
  return clamped / MODEL_TEMPERATURE_LEVELS;
}

export function temperatureToLevel(temperature: number): number {
  const clamped = Math.min(1, Math.max(0.1, temperature));
  return Math.min(
    MODEL_TEMPERATURE_LEVELS,
    Math.max(1, Math.round(clamped * MODEL_TEMPERATURE_LEVELS)),
  );
}

export function readStoredTemperatureLevel(workId: string): number {
  if (typeof window === "undefined") return DEFAULT_MODEL_TEMPERATURE_LEVEL;
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${workId}`);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return DEFAULT_MODEL_TEMPERATURE_LEVEL;
  return Math.min(MODEL_TEMPERATURE_LEVELS, Math.max(1, parsed));
}

export function writeStoredTemperatureLevel(workId: string, level: number) {
  if (typeof window === "undefined") return;
  const clamped = Math.min(
    MODEL_TEMPERATURE_LEVELS,
    Math.max(1, Math.round(level)),
  );
  window.localStorage.setItem(`${STORAGE_PREFIX}${workId}`, String(clamped));
}

export function formatTemperature(level: number): string {
  return levelToTemperature(level).toFixed(1);
}
