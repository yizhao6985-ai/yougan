import { applyThemeToDocument, resolveTheme } from "@/lib/theme";
import { useSystemTheme } from "@/hooks/use-system-theme";
import { useThemePreference } from "@/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference] = useThemePreference();
  const systemTheme = useSystemTheme();
  const resolved =
    preference === "system" ? systemTheme : resolveTheme(preference);

  if (typeof document !== "undefined") {
    applyThemeToDocument(resolved);
  }

  return children;
}
