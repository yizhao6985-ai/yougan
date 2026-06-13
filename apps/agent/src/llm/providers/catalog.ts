/**
 * Agent Chat 模型目录。
 * 仅两个对话模型：Qwen（百炼）、MiniMax（全模态）。
 */
export const QWEN_MODELS = {
  default: "qwen3.7-max-2026-06-08",
} as const;

export const MINIMAX_MODELS = {
  m3: "MiniMax-M3",
} as const;

export const QWEN_MAX_CONTEXT = 990_000 as const;
export const MINIMAX_MAX_CONTEXT = 1_000_000 as const;

export type QwenModelId = (typeof QWEN_MODELS)[keyof typeof QWEN_MODELS];
export type MiniMaxModelId = (typeof MINIMAX_MODELS)[keyof typeof MINIMAX_MODELS];

/** 百炼文生图（非 Chat，仍走 DashScope 原生 API） */
export const DASHSCOPE_IMAGE_MODELS = {
  qwenImage20Pro: "qwen-image-2.0-pro",
} as const;

/** 百炼语音识别（非 Chat，仍走 DashScope 原生 API） */
export const DASHSCOPE_ASR_MODELS = {
  funAsr: "fun-asr",
} as const;

export type DashScopeImageModelId =
  (typeof DASHSCOPE_IMAGE_MODELS)[keyof typeof DASHSCOPE_IMAGE_MODELS];

export type DashScopeAsrModelId =
  (typeof DASHSCOPE_ASR_MODELS)[keyof typeof DASHSCOPE_ASR_MODELS];
