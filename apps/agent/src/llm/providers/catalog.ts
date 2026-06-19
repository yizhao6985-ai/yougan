/**
 * 百炼 DashScope 模型配置（代码内维护；env 仅提供 API Key 与 Base URL）。
 *
 * 切换模型：只改此对象。
 */
export const DASHSCOPE_MODELS = {
  /** 主对话、结构化 work、tool calling */
  chat: "deepseek-v4-pro",
  /** 参考素材多模态分析 */
  multimodal: "qwen3.5-omni-flash-realtime",
  /** 设计任务文生图 */
  image: "qwen-image-2.0-pro-2026-04-22",
} as const;

export type DashScopeModelRole = keyof typeof DASHSCOPE_MODELS;
