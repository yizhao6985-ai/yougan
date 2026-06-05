/** 创作台回合阶段：作品方案 → 创作 → 提问（由 Agent 按消息自动路由） */
export const CHAT_MODES = ["blueprint", "creation", "ask"] as const;

export type ChatMode = (typeof CHAT_MODES)[number];
