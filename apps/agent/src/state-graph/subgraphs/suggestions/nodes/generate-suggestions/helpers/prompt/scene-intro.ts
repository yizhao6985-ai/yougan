import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";

import type { NextStepSuggestionsPromptInput } from "./types.js";

export function buildSceneIntro(input: NextStepSuggestionsPromptInput): string {
  const { count, isOpening, topicMode, profileSetupMode } = input;

  if (topicMode) {
    return `${YOUGAN_USER_LABEL}刚打开本对话，thread 尚无消息，且作品尚无已沉淀方案。请根据**作品标题**生成 ${count} 条**可立刻开始创作的具体方向**可点击建议（可含图文、绘画、音视频等形态）。`;
  }

  if (profileSetupMode) {
    return `作品处于**方案步骤引导**阶段。前 3 条锚定侧栏**当前推进步**（延伸灵感）；最后 1 条引导**进入下一步**（或方案就绪时开始制作）。`;
  }

  if (isOpening) {
    return `${YOUGAN_USER_LABEL}刚在本作品下打开新对话，thread 尚无消息。请根据**作品当前状态**生成 ${count} 条**下一步工作**可点击建议。`;
  }

  return `请根据**作品当前状态**、${YOUGAN_USER_LABEL}上一条消息与 AI 刚回复，生成 ${count} 条**下一步工作**可点击建议。`;
}
