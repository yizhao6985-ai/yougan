/** 创作台回合阶段：作品方案 → 制作 → 提问（由 Agent 按消息自动路由） */
export const CHAT_MODES = ["profile", "production", "ask"] as const;

export type ChatMode = (typeof CHAT_MODES)[number];
