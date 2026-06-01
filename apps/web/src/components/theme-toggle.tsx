import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { THEME } from "@/lib/site-copy";
import { getSystemTheme, type ResolvedTheme } from "@/lib/theme";
import { useThemePreference } from "@/store/theme";
import { cn } from "@/lib/utils";

function useResolvedTheme(): ResolvedTheme {
  const [preference] = useThemePreference();
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    if (preference !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemTheme(getSystemTheme());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [preference]);

  if (preference === "system") return systemTheme;
  return preference;
}

export function ThemeToggle() {
  const [, setPreference] = useThemePreference();
  const resolved = useResolvedTheme();
  const isDark = resolved === "dark";

  return (
    <div
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-card/90 px-2.5 shadow-sm shadow-border/25 md:h-11 md:gap-2 md:px-3",
      )}
      title={THEME.darkMode}
    >
      <SunIcon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isDark ? "text-muted-foreground/50" : "text-primary",
        )}
        aria-hidden
      />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setPreference(checked ? "dark" : "light")}
        aria-label={THEME.darkMode}
      />
      <MoonIcon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isDark ? "text-primary" : "text-muted-foreground/50",
        )}
        aria-hidden
      />
      <span className="sr-only">{THEME.darkMode}</span>
    </div>
  );
}
