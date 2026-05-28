import { useEffect } from "react";

import { localeToHtmlLang } from "@/lib/i18n";
import { useEffectiveLocale } from "@/store/locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useEffectiveLocale();

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  return children;
}
