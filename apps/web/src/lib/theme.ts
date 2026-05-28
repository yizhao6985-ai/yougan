export const THEME_STORAGE_KEY = "yougan-theme";

export type ThemePreference = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredThemePreference(): ThemePreference {
  const raw =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(THEME_STORAGE_KEY)
      : null;
  return isThemePreference(raw) ? raw : "system";
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

export function applyThemeToDocument(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/** 首屏防闪烁：在 React 挂载前于 index.html 内联调用同等逻辑 */
export function initThemeFromStorage() {
  applyThemeToDocument(resolveTheme(readStoredThemePreference()));
}
