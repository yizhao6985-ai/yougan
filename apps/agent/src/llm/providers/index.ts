/**
 * 模型工厂：Qwen 对话 + MiniMax 多模态；文生图 / ASR 仍走百炼原生 API。
 */
export {
  DASHSCOPE_ASR_MODELS,
  DASHSCOPE_IMAGE_MODELS,
  MINIMAX_MAX_CONTEXT,
  MINIMAX_MODELS,
  QWEN_MAX_CONTEXT,
  QWEN_MODELS,
  type DashScopeAsrModelId,
  type DashScopeImageModelId,
  type MiniMaxModelId,
  type QwenModelId,
} from "./catalog.js";
export { createChatModel } from "./dashscope.js";
export { createMultimodalChatModel } from "./minimax.js";
export { transcribeRemoteMedia } from "./dashscope-asr.js";
export {
  generateImage,
  type GenerateImageInput,
  type GenerateImageResult,
} from "./dashscope-image.js";
