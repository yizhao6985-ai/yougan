export function buildParseReferenceTextPrompt(referenceText: string): string {
  return `提取参考文案的结构、语气、关键词，输出简洁中文摘要。\n\n${referenceText}`;
}
