import { atom } from "jotai";
import { useAtom } from "jotai";

import {
  getEffectiveLocale,
  readStoredLocale,
  type LocaleId,
  LOCALE_STORAGE_KEY,
} from "@/lib/i18n";
import { writeStoredString } from "@/lib/storage-value";

const localePreferenceBaseAtom = atom<LocaleId>(readStoredLocale());

export const localePreferenceAtom = atom(
  (get) => get(localePreferenceBaseAtom),
  (get, set, update: LocaleId) => {
    writeStoredString(LOCALE_STORAGE_KEY, update);
    set(localePreferenceBaseAtom, update);
  },
);

export function useLocalePreference() {
  return useAtom(localePreferenceAtom);
}

/** 界面实际使用的语言（当前仅中文） */
export function useEffectiveLocale() {
  const [preference] = useLocalePreference();
  return getEffectiveLocale(preference);
}
