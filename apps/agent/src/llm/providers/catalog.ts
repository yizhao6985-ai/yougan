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

/** MiniMax 文生图（非 Chat） */
export const MINIMAX_IMAGE_MODELS = {
  image01: "image-01",
} as const;

export type MiniMaxImageModelId =
  (typeof MINIMAX_IMAGE_MODELS)[keyof typeof MINIMAX_IMAGE_MODELS];

export const QWEN_MAX_CONTEXT = 990_000 as const;
export const MINIMAX_MAX_CONTEXT = 1_000_000 as const;

export type QwenModelId = (typeof QWEN_MODELS)[keyof typeof QWEN_MODELS];
export type MiniMaxModelId = (typeof MINIMAX_MODELS)[keyof typeof MINIMAX_MODELS];

/** 百炼语音识别（非 Chat，仍走 DashScope 原生 API） */
export const DASHSCOPE_ASR_MODELS = {
  funAsr: "fun-asr",
} as const;

export type DashScopeAsrModelId =
  (typeof DASHSCOPE_ASR_MODELS)[keyof typeof DASHSCOPE_ASR_MODELS];
