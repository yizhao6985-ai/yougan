/**
 * Agent 可用模型目录（百炼 ID、上下文窗口）。
 * @see https://help.aliyun.com/zh/model-studio/getting-started/models
 */
export const DASHSCOPE_TEXT_MODELS = {
  qwen37Max: "qwen3.7-max",
} as const;

export const DASHSCOPE_TEXT_MODEL_MAX_CONTEXT = 990_000 as const;

export type DashScopeTextModelId =
  (typeof DASHSCOPE_TEXT_MODELS)[keyof typeof DASHSCOPE_TEXT_MODELS];

export const DASHSCOPE_IMAGE_MODELS = {
  qwenImage20Pro: "qwen-image-2.0-pro",
} as const;

/** 非实时语音识别（Fun-ASR / Paraformer 系列） */
export const DASHSCOPE_ASR_MODELS = {
  funAsr: "fun-asr",
} as const;

export type DashScopeImageModelId =
  (typeof DASHSCOPE_IMAGE_MODELS)[keyof typeof DASHSCOPE_IMAGE_MODELS];

export type DashScopeAsrModelId =
  (typeof DASHSCOPE_ASR_MODELS)[keyof typeof DASHSCOPE_ASR_MODELS];
