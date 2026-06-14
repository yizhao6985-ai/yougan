export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

/** Agent SDK 走 API 中间层代理 */
export const LANGGRAPH_API_URL =
  import.meta.env.VITE_LANGGRAPH_API_URL ?? `${API_BASE_URL}/agent`;

/** RAG 客服 Agent（AG-UI Protocol，经 API 代理） */
export const RAG_CHAT_API_URL =
  import.meta.env.VITE_RAG_CHAT_API_URL ?? `${API_BASE_URL}/api/v1/chat`;

export const AUTH_TOKEN_KEY = "yougan:token";
export const ACTIVE_WORK_KEY = "yougan:activeWorkId";
export const ACTIVE_CONVERSATION_BY_WORK_KEY = "yougan:activeConversationByWork";
