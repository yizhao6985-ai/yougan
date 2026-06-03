import { localeToHtmlLang } from "@/lib/i18n";
import { useEffectiveLocale } from "@/store/locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useEffectiveLocale();

  if (typeof document !== "undefined") {
    document.documentElement.lang = localeToHtmlLang(locale);
  }

  return children;
}
