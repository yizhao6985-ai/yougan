import { readStoredString, writeStoredString } from "@/lib/storage-value";

export const STUDIO_DRAWER_OPEN_KEY = "yougan:creative-context-drawer-open";
export const STUDIO_DRAWER_OPEN_EVENT = "yougan:studio-drawer-open";

export function requestCreativeContextDrawerOpen() {
  writeStoredString(STUDIO_DRAWER_OPEN_KEY, "1");
  window.dispatchEvent(
    new CustomEvent(STUDIO_DRAWER_OPEN_EVENT, { detail: { open: true } }),
  );
}

export function readCreativeContextDrawerOpen() {
  const raw = readStoredString(STUDIO_DRAWER_OPEN_KEY);
  if (raw === "0") return false;
  if (raw === "1") return true;
  return true;
}
