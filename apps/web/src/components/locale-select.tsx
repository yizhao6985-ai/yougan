import { GlobeIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALE } from "@/lib/site-copy";
import { getLocaleOption, LOCALE_OPTIONS, type LocaleId } from "@/lib/i18n";
import { useLocalePreference } from "@/store/locale";
import { cn } from "@/lib/utils";

export function LocaleSelect() {
  const [preference, setPreference] = useLocalePreference();
  const current = getLocaleOption(preference);

  return (
    <Select
      value={preference}
      onValueChange={(value) => setPreference(value as LocaleId)}
    >
      <SelectTrigger
        className={cn(
          "h-10 w-auto min-w-[4.75rem] gap-1.5 rounded-lg border-border/80 bg-card/90 px-2.5 shadow-sm shadow-border/25 md:h-11 md:min-w-[5.5rem] md:px-3",
          "focus:ring-ring/50 [&>span]:flex [&>span]:items-center [&>span]:gap-1.5",
        )}
        aria-label={LOCALE.label}
      >
        <GlobeIcon className="size-4 shrink-0 text-primary" aria-hidden />
        <SelectValue>
          <span className="hidden sm:inline">{current.short}</span>
          <span className="sm:hidden">{current.short}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {LOCALE_OPTIONS.map((option) => (
          <SelectItem
            key={option.id}
            value={option.id}
            disabled={!option.available}
            className={cn(!option.available && "opacity-60")}
          >
            <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
              <span>{option.label}</span>
              {!option.available ? (
                <span className="text-xs text-muted-foreground">
                  {LOCALE.comingSoon}
                </span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
