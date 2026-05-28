import { atom } from "jotai";
import { useAtom } from "jotai";

import {
  readStoredThemePreference,
  type ThemePreference,
  THEME_STORAGE_KEY,
} from "@/lib/theme";
import { writeStoredString } from "@/lib/storage-value";

const themePreferenceBaseAtom = atom<ThemePreference>(readStoredThemePreference());

export const themePreferenceAtom = atom(
  (get) => get(themePreferenceBaseAtom),
  (get, set, update: ThemePreference) => {
    writeStoredString(THEME_STORAGE_KEY, update);
    set(themePreferenceBaseAtom, update);
  },
);

export function useThemePreference() {
  return useAtom(themePreferenceAtom);
}
