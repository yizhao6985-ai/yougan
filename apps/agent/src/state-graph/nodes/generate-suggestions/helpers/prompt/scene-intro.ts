import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";

import type { NextStepSuggestionsPromptInput } from "./types.js";

export function buildSceneIntro(input: NextStepSuggestionsPromptInput): string {
  const { count, isOpening, topicMode } = input;

  if (topicMode) {
    return `${YOUGAN_USER_LABEL}刚打开本对话，thread 尚无消息，且作品尚无已沉淀方案。请根据**作品标题**生成 ${count} 条**可立刻开始创作的具体方向**可点击建议。`;
  }

  if (isOpening) {
    return `${YOUGAN_USER_LABEL}刚在本作品下打开新对话，thread 尚无消息。请根据**作品当前状态**生成 ${count} 条**下一步工作**可点击建议。`;
  }

  return `请根据**作品当前状态**、${YOUGAN_USER_LABEL}上一条消息与 AI 刚回复，生成 ${count} 条**下一步工作**可点击建议。`;
}
