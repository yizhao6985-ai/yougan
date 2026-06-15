import type { NextStepSuggestionsPromptInput } from "./types.js";

function buildHintRule(input: NextStepSuggestionsPromptInput): string {
  if (input.topicMode) {
    return "hint：留空字符串（开屏操作指引由前端标题统一展示）";
  }
  if (input.profileSetupMode) {
    return "hint：一行操作指引，说明巩固与推进双意图（可参考方案建议上下文中的 hint 参考）";
  }
  return "hint：仅一行操作指引（≤14 字）";
}

export function buildConstraintsSection(
  input: NextStepSuggestionsPromptInput,
): string {
  return `## 禁止
- 不要围绕对话标题或「对话 N」类占位名发挥（除非与作品标题相同）
- 禁止流程动作、客服腔、空泛套话、「补充想法 / 自由输入」类兜底
- 方案引导阶段：禁止建议内容偏离当前推进步（侧栏高亮步）
- ${buildHintRule(input)}；勿写右侧面板、勿重复 suggestions`;
}
