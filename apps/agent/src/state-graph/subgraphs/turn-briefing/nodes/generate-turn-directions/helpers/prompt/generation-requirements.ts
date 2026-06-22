import type { SuggestionLayerCounts } from "@yougan/domain";

import { buildPromptLengthGuidance } from "./message-length.js";

export function buildGenerationRequirements(
  count: number,
  options: {
    layered: boolean;
    layerCounts: SuggestionLayerCounts;
    slotRecipe: string;
    titleAnchored?: boolean;
  },
): string {
  const { layered, layerCounts, slotRecipe, titleAnchored } = options;
  const { consolidate, advance } = layerCounts;

  const primarySource = titleAnchored
    ? "根据前述**作品标题**（优先于空方案状态）"
    : "根据**作品当前状态**";

  const layerSection = layered
    ? `

## 方向分层（须逐条对应槽位配方）
- **扩展当前状态**（${consolidate} 条）：锚定作品当前推进步；prompt 须是用户会说的具体补充/微调，禁止栏目名；outcome 说明对当前方案/成稿的深化效果
- **下一步引导**（${advance} 条）：prompt 像用户会发送的那句话；outcome 说明推进后作品会进入什么状态
${slotRecipe}`
    : `

## 方向分层（尚无方案，全部为引导）
- ${count} 条均为**下一步引导**；每条是着手完成标题所指作品的不同切入点
${slotRecipe}`;

  return `

## 生成要求
1. ${primarySource}给出**具体可执行**延伸方向
2. **先写 prompt**（用户会发的完整话），再从中压缩出 label；两条须同一口吻、同一意图
3. 已有方案或成稿时：承接已有主题，禁止当成空白重来
4. 恰好 ${count} 条${layerSection}${buildPromptLengthGuidance(count)}`;
}
