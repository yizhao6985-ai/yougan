import { atom } from "jotai";

import { ACTIVE_WORK_KEY } from "@/lib/env";
import { readStoredString, writeStoredString } from "@/lib/storage-value";

const activeWorkIdBaseAtom = atom<string | null>(
  readStoredString(ACTIVE_WORK_KEY),
);

export const activeWorkIdAtom = atom(
  (get) => get(activeWorkIdBaseAtom),
  (
    get,
    set,
    update: string | null | ((prev: string | null) => string | null),
  ) => {
    const prev = get(activeWorkIdBaseAtom);
    const next = typeof update === "function" ? update(prev) : update;
    writeStoredString(ACTIVE_WORK_KEY, next);
    set(activeWorkIdBaseAtom, next);
  },
);
