import type { SuggestionLayerCounts } from "@yougan/domain";

import { buildMessageLengthGuidance } from "./message-length.js";

export function buildGenerationRequirements(
  count: number,
  options: {
    layered: boolean;
    layerCounts: SuggestionLayerCounts;
    slotRecipe: string;
  },
): string {
  const { layered, layerCounts, slotRecipe } = options;
  const { consolidate, advance } = layerCounts;

  const layerSection = layered
    ? `

## 建议分层（须逐条对应槽位配方）
- **扩展当前状态**（${consolidate} 条）：锚定作品**当前进度**（方案步、成稿段落等），给灵感、补全、微调、改稿等可执行说法；须互斥、可区分
- **下一步引导**（${advance} 条）：像用户主动推进——进入方案下一步、开始制作、发布准备等；禁止元说明与空泛套话
${slotRecipe}`
    : `

## 建议分层（尚无方案，全部为引导）
- ${count} 条均为**下一步引导**：根据作品标题、参考素材与对话上下文，给出可立刻动手的具体方向；互斥、可区分，覆盖不同切口/体裁/形态
${slotRecipe}`;

  return `

## 生成要求
1. 根据**作品当前状态**给出**具体可执行**的下一步，像用户会真的会发送的那句话
2. 已有方案或成稿进展时：承接已有主题与进度，禁止当成空白重来
3. message 禁止空泛套话（「聊聊方向」「找灵感」「理清思路」「探索可能性」「继续填写」）
4. 恰好 ${count} 条${layerSection}${buildMessageLengthGuidance(count)}`;
}
