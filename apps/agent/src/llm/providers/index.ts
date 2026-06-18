/**
 * 百炼 DashScope 模型工厂：文本 Chat、Omni 多模态、文生图。
 */
export {
  DASHSCOPE_MODELS,
  type DashScopeModelRole,
} from "./catalog.js";
export {
  getDashScopeChatKwargs,
  resolveDashScopeChatFamily,
  resolveDashScopeMeteringModelId,
  type DashScopeChatFamily,
  type DashScopeChatScenario,
} from "./dashscope-chat-config.js";
export { createChatModel, createProductionChatModel } from "./dashscope.js";
export { createMultimodalChatModel } from "./dashscope-multimodal.js";
export {
  generateDesignImage,
  type GenerateDesignImageInput,
  type GenerateDesignImageResult,
} from "./dashscope-image.js";
