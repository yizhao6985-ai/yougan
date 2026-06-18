import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";

import type { NextStepSuggestionsPromptInput } from "./types.js";

export function buildSceneIntro(input: NextStepSuggestionsPromptInput): string {
  const { count, isOpening, layered } = input;
  const layerNote = layered
    ? "按槽位配方区分「扩展当前状态」与「下一步引导」"
    : "全部为「下一步引导」，按标题与上下文动态覆盖不同起点";

  if (isOpening) {
    return `${YOUGAN_USER_LABEL}刚打开本对话，thread 尚无消息。请根据**作品当前状态**生成 ${count} 条可点击的下一步建议（${layerNote}）。`;
  }

  return `请根据**作品当前状态**、${YOUGAN_USER_LABEL}上一条消息与 AI 刚回复，生成 ${count} 条可点击的下一步建议（${layerNote}）。`;
}
