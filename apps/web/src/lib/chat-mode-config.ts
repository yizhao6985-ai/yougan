import type { ChatMode } from "@/lib/types";
import { CHAT_MODE_LABELS, CHAT_MODES } from "@/lib/types";

export { CHAT_MODES, CHAT_MODE_LABELS };

/** Alt/Option + 数字键，顺序与 CHAT_MODES 一致 */
export const MODE_SHORTCUT_DIGITS: Record<ChatMode, string> = {
  inspiration: "Digit1",
  creation: "Digit2",
  ask: "Digit3",
};

export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function modeShortcutLabel(mode: ChatMode) {
  const digit = CHAT_MODES.indexOf(mode) + 1;
  const mod = isMacPlatform() ? "⌥" : "Alt";
  return `${mod}${digit}`;
}

export function modeLabelWithShortcut(mode: ChatMode) {
  return `${CHAT_MODE_LABELS[mode]} (${modeShortcutLabel(mode)})`;
}

export function modeFromShortcut(event: KeyboardEvent): ChatMode | null {
  if (!event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
    return null;
  }

  if (event.repeat) return null;

  const entry = Object.entries(MODE_SHORTCUT_DIGITS).find(
    ([, code]) => code === event.code,
  );
  return entry ? (entry[0] as ChatMode) : null;
}
