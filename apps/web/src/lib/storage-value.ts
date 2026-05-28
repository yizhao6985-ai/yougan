export function readStoredString(key: string): string | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
    } catch {
      // fall through to raw value
    }
  }

  return raw;
}

export function writeStoredString(key: string, value: string | null) {
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}
