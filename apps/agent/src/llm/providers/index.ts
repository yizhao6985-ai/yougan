/**
 * 模型工厂：Qwen 对话 + MiniMax 多模态/文生图；ASR 仍走百炼原生 API。
 */
export {
  DASHSCOPE_ASR_MODELS,
  MINIMAX_MAX_CONTEXT,
  MINIMAX_IMAGE_MODELS,
  MINIMAX_MODELS,
  QWEN_MAX_CONTEXT,
  QWEN_MODELS,
  type DashScopeAsrModelId,
  type MiniMaxImageModelId,
  type MiniMaxModelId,
  type QwenModelId,
} from "./catalog.js";
export { createChatModel, createProductionChatModel } from "./dashscope.js";
export { createMultimodalChatModel } from "./minimax.js";
export {
  generateMiniMaxImage,
  type GenerateMiniMaxImageInput,
  type GenerateMiniMaxImageResult,
} from "./minimax-image.js";
export { transcribeRemoteMedia } from "./dashscope-asr.js";
