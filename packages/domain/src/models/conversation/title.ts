/**
 * 对话标题约束（侧栏展示、自动命名、sanitize 共用）。
 */

/** 系统占位标题模式，如「对话 1」「对话 2」 */
export const DEFAULT_CONVERSATION_TITLE_RE = /^对话\s*\d+$/;

/** 自动生成的对话标题字数上限 */
export const MAX_CONVERSATION_TITLE_LENGTH = 24;
