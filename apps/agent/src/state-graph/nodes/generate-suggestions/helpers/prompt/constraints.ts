import type { NextStepSuggestionsPromptInput } from "./types.js";

function buildHintRule(input: NextStepSuggestionsPromptInput): string {
  return input.topicMode
    ? "hint：留空字符串（开屏操作指引由前端标题统一展示）"
    : "hint：仅一行操作指引（≤14 字）";
}

export function buildConstraintsSection(
  input: NextStepSuggestionsPromptInput,
): string {
  return `## 禁止
- 不要围绕对话标题或「对话 N」类占位名发挥（除非与作品标题相同）
- 禁止流程动作、客服腔、空泛套话、「补充想法 / 自由输入」类兜底
- ${buildHintRule(input)}；勿写右侧面板、勿重复 suggestions`;
}
