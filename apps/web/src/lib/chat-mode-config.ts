import type { ChatMode } from "@/lib/types";
import { CHAT_MODE_LABELS, CHAT_MODES } from "@/lib/types";

export { CHAT_MODES, CHAT_MODE_LABELS };

export const MODE_SHORTCUT_KEYS: Record<ChatMode, string> = {
  inspiration: "1",
  outline: "2",
  creation: "3",
};

export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function modeShortcutLabel(mode: ChatMode) {
  const key = MODE_SHORTCUT_KEYS[mode];
  return isMacPlatform() ? `⌘⇧${key}` : `Ctrl+Shift+${key}`;
}

export function modeLabelWithShortcut(mode: ChatMode) {
  return `${CHAT_MODE_LABELS[mode]} ${modeShortcutLabel(mode)}`;
}

export function modeFromShortcut(event: KeyboardEvent): ChatMode | null {
  if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) {
    return null;
  }

  const entry = Object.entries(MODE_SHORTCUT_KEYS).find(
    ([, key]) => key === event.key,
  );
  return entry ? (entry[0] as ChatMode) : null;
}
