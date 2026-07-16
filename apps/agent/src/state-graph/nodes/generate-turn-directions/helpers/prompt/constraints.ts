import type { ContentFormatId } from "@yougan/domain";

import type { TurnDirectionsPromptInput } from "./types.js";
import { isPlaceholderWorkTitle } from "./work-title.js";

function buildTitleAnchorRule(workTitle: string | undefined): string {
  if (isPlaceholderWorkTitle(workTitle)) {
    return "- 作品标题尚为占位：示例方向仅作句式参考，禁止照搬示例中的具体题材";
  }
  return `- **题材锚定**：每条方向必须紧扣前述「作品标题」整体语义，帮助完成标题所指的那件作品
- 禁止把标题拆成关键词后发散成同领域泛选题；方向须完成标题整体主旨，而非借标题中个别词另起独立选题
- 方向之间可互斥，但须同属标题所指作品`;
}

function buildFormatAnchorRule(
  format: ContentFormatId | null | undefined,
  formatLabel?: string | null,
): string {
  if (!format) {
    return "- 若作品状态已写出形式/体裁，建议须留在该形态内，禁止串成测评、探店、口播等其它选题";
  }
  const label = formatLabel?.trim() || format;
  return `- **体裁锚定**：本件是「${label}」——每条方向必须推进这件${label}，禁止改成测评、探店、口播、插画等其它形态`;
}

function buildHintRule(input: TurnDirectionsPromptInput): string {
  if (input.isOpening) {
    return "hint：留空字符串（开屏操作指引由前端标题统一展示）";
  }
  return "hint：仅一行操作指引（≤14 字）";
}

export function buildConstraintsSection(
  input: TurnDirectionsPromptInput,
  options?: {
    workTitle?: string;
    format?: ContentFormatId | null;
    formatLabel?: string | null;
  },
): string {
  return `## 口吻（label 与 prompt 均须遵守）
- 一律模拟**用户发给 AI** 的口语：可直接点击发送，读完即知「点了会说什么」
- prompt：完整可发送句；label：其在 chip 上的自然缩短（前半句或同义压缩），**禁止与 prompt 脱节**
- 可用「我」「帮」「不要」「全文」「开头」等用户常用说法；禁止第三人称栏目名、编辑备忘腔
- **禁止**抽象标签/话题名：如「雷区」「清单」「预警」「细节补充」「禁忌汇总」「语气把控」等看不出具体内容的短语
- **禁止**流程元说明：如「推进到下一步」「帮我填边界」「确定风格」——须直接写出要说的具体内容

## 禁止
- 不要围绕对话标题或「对话」类占位名发挥
- 禁止流程动作、客服腔、空泛套话
${buildTitleAnchorRule(options?.workTitle)}
${buildFormatAnchorRule(options?.format, options?.formatLabel)}
- 每条须是用户着手推进作品的一句可发送话
- ${buildHintRule(input)}；勿写右侧面板
- outcome 只写对作品/方案的效果，不复述 prompt 原文

## 正反例（边界步，仅作句式参考）
- ✅ prompt：「标题不要用震惊体，也别带真实品牌名」；label：「标题别用震惊体」
- ❌ label：「别碰的雷区」「避用词汇清单」「语气过火预警」——读者看不出点了会发什么

## JSON 格式（必须遵守）
- 每条 direction 含 \`label\`、\`prompt\`、\`outcome\` 三字段；${input.count} 条须为独立对象
- prompt 内**禁止**英文双引号 \`"\`；引用用「」`;
}
