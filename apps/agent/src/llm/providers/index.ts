/**
 * 模型工厂：只负责创建 Chat / 文生图客户端，不包含 invoke。
 */
export {
  DASHSCOPE_IMAGE_MODELS,
  DASHSCOPE_TEXT_MODELS,
  DASHSCOPE_TEXT_MODEL_MAX_CONTEXT,
  type DashScopeImageModelId,
  type DashScopeTextModelId,
} from "./catalog.js";
export { createChatModel } from "./dashscope.js";
export {
  generateImage,
  type GenerateImageInput,
  type GenerateImageResult,
} from "./dashscope-image.js";
