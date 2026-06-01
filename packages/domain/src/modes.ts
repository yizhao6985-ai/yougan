/** 创作台对话模式：灵感 → 创作 → 提问 */
export const CHAT_MODES = ["inspiration", "creation", "ask"] as const;

export type ChatMode = (typeof CHAT_MODES)[number];

export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  inspiration: "灵感模式",
  creation: "创作模式",
  ask: "提问模式",
};
