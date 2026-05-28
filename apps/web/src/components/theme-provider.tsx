import { useEffect } from "react";

import {
  applyThemeToDocument,
  getSystemTheme,
  resolveTheme,
} from "@/lib/theme";
import { useThemePreference } from "@/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference] = useThemePreference();

  useEffect(() => {
    applyThemeToDocument(resolveTheme(preference));
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyThemeToDocument(getSystemTheme());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [preference]);

  return children;
}
