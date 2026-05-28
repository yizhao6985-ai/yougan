import { atom } from "jotai";
import { useAtomValue } from "jotai";

import { AUTH_TOKEN_KEY } from "@/lib/env";
import { readStoredString, writeStoredString } from "@/lib/storage-value";

const authTokenBaseAtom = atom<string | null>(
  readStoredString(AUTH_TOKEN_KEY),
);

export const authTokenAtom = atom(
  (get) => get(authTokenBaseAtom),
  (
    get,
    set,
    update: string | null | ((prev: string | null) => string | null),
  ) => {
    const prev = get(authTokenBaseAtom);
    const next = typeof update === "function" ? update(prev) : update;
    writeStoredString(AUTH_TOKEN_KEY, next);
    set(authTokenBaseAtom, next);
  },
);

export function useAuthToken() {
  return useAtomValue(authTokenAtom);
}

export function useIsAuthenticated() {
  return Boolean(useAuthToken());
}
