/**
 * 对话标题约束（侧栏展示、自动命名、sanitize 共用）。
 */

/** 新建对话的占位标题（发送首条消息后自动替换） */
export const DEFAULT_CONVERSATION_TITLE = "对话";

/** 系统占位标题：「对话」或历史占位「对话 N」「新对话」 */
export const DEFAULT_CONVERSATION_TITLE_RE = /^(对话(\s*\d+)?|新对话)$/;

/** 自动生成的对话标题字数上限 */
export const MAX_CONVERSATION_TITLE_LENGTH = 24;
