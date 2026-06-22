import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";

import type { TurnDirectionsPromptInput } from "./types.js";
import { isPlaceholderWorkTitle, resolveWorkTitle } from "./work-title.js";

export function buildSceneIntro(input: TurnDirectionsPromptInput): string {
  const { count, isOpening, layered, workTitle } = input;
  const layerNote = layered
    ? "按槽位配方区分「扩展当前状态」与「下一步引导」"
    : "全部为「下一步引导」，每条须是着手完成标题所指作品的不同切入点";

  if (isOpening) {
    const titleNote = isPlaceholderWorkTitle(workTitle)
      ? "请根据**作品当前状态**"
      : `用户已将本作品命名为「${resolveWorkTitle(workTitle)}」。请**紧扣该标题整体语义**`;
    return `${YOUGAN_USER_LABEL}刚打开本对话，thread 尚无消息。${titleNote}生成 ${count} 条可点击的延伸方向（${layerNote}）。`;
  }

  return `请根据**作品当前状态**与${YOUGAN_USER_LABEL}上一条消息，生成 ${count} 条互斥、可区分的延伸方向（${layerNote}）。`;
}
