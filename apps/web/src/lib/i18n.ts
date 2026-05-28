/** 多语言占位：仅 zh-CN 生效，其余语言仅 UI 展示 */

export const LOCALE_STORAGE_KEY = "yougan-locale";

export type LocaleId = "zh-CN" | "en-US";

export const DEFAULT_LOCALE: LocaleId = "zh-CN";

export type LocaleOption = {
  id: LocaleId;
  label: string;
  short: string;
  /** 是否已接入文案（false 时在选单中禁用） */
  available: boolean;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: "zh-CN", label: "简体中文", short: "中文", available: true },
  { id: "en-US", label: "English", short: "EN", available: false },
];

export function isLocaleId(value: string | null): value is LocaleId {
  return value === "zh-CN" || value === "en-US";
}

export function readStoredLocale(): LocaleId {
  const raw =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(LOCALE_STORAGE_KEY)
      : null;
  return isLocaleId(raw) ? raw : DEFAULT_LOCALE;
}

/** 实际用于渲染与 html[lang] 的语言（当前恒为中文） */
export function getEffectiveLocale(_preference: LocaleId): LocaleId {
  return DEFAULT_LOCALE;
}

export function localeToHtmlLang(locale: LocaleId): string {
  return locale === "zh-CN" ? "zh-CN" : "en";
}

export function getLocaleOption(id: LocaleId): LocaleOption {
  return LOCALE_OPTIONS.find((item) => item.id === id) ?? LOCALE_OPTIONS[0];
}
