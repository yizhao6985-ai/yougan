/** 版本号变更后同一会话可重新播放一次开场动画 */
const STORAGE_PREFIX = "yougan:opening-reveal:v2:";

function storageKey(conversationId: string): string {
  return `${STORAGE_PREFIX}${conversationId}`;
}

export function hasPlayedOpeningReveal(conversationId: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(storageKey(conversationId)) === "1";
  } catch {
    return false;
  }
}

export function markOpeningRevealPlayed(conversationId: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(conversationId), "1");
  } catch {
    // ignore quota / private mode
  }
}
