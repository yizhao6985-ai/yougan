import type { NextStepSuggestionsPromptInput } from "./types.js";

function buildHintRule(input: NextStepSuggestionsPromptInput): string {
  if (input.isOpening) {
    return "hint：留空字符串（开屏操作指引由前端标题统一展示）";
  }
  return "hint：仅一行操作指引（≤14 字）";
}

export function buildConstraintsSection(
  input: NextStepSuggestionsPromptInput,
): string {
  const layerRule = input.layered
    ? "- 有方案/成稿进展时：扩展向锚定当前步并紧扣前述已定内容；引导向须直接写下一步的具体内容草案，禁止流程元说明"
    : "- 尚无方案时：全部为引导向建议，基于标题与上下文给可执行起点";

  return `## 禁止
- 不要围绕对话标题或「对话」类占位名发挥（除非与作品标题相同）
- 禁止流程动作、客服腔、空泛套话、「补充想法 / 自由输入」类兜底
${layerRule}
- ${buildHintRule(input)}；勿写右侧面板、勿重复 suggestions

## JSON 格式（必须遵守，否则解析失败）
- 每条 suggestion 仅含 \`message\` 字段；${input.count} 条须为独立对象，不可合并
- \`message\` 内**禁止**英文双引号 \`"\`；引用短语用「」或书名号《》，强调用破折号或括号
- 示例：节拍按「挤压—裂缝—崩塌」三层推进；痛苦不说「痛苦」，用动作呈现`;
}
