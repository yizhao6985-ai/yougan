/**
 * Agent 主体推理文本模型（百炼 OpenAI 兼容 ID）。
 * 图像生成模型见 DASHSCOPE_IMAGE_MODELS。
 * @see https://help.aliyun.com/zh/model-studio/getting-started/models
 */
export const DASHSCOPE_TEXT_MODELS = {
  qwen37Max: "qwen3.7-max",
  deepseekV4Pro: "deepseek-v4-pro",
} as const;

/** 上述文本推理模型的上下文窗口（tokens） */
export const DASHSCOPE_TEXT_MODEL_MAX_CONTEXT = 990_000 as const;

export type DashScopeTextModelId =
  (typeof DASHSCOPE_TEXT_MODELS)[keyof typeof DASHSCOPE_TEXT_MODELS];

/** 百炼图像生成模型（Qwen-Image，独立 multimodal-generation 端点） */
export const DASHSCOPE_IMAGE_MODELS = {
  qwenImage20Pro: "qwen-image-2.0-pro",
} as const;

export type DashScopeImageModelId =
  (typeof DASHSCOPE_IMAGE_MODELS)[keyof typeof DASHSCOPE_IMAGE_MODELS];

/** Agent 文本模型按场景选用的角色 */
export type TextLlmRole = "chat" | "structured";
