import type { ReferenceAnalysis } from "@yougan/domain";

function formatAnalysisContext(analysis: ReferenceAnalysis): string {
  const parts = [`摘要：${analysis.summary.trim()}`];
  if (analysis.style_hints?.length) {
    parts.push(`风格：${analysis.style_hints.join("、")}`);
  }
  if (analysis.tone_hints?.length) {
    parts.push(`语气：${analysis.tone_hints.join("、")}`);
  }
  if (analysis.structure_hints?.length) {
    parts.push(`结构：${analysis.structure_hints.join("、")}`);
  }
  if (analysis.visual_cues?.trim()) {
    parts.push(`视觉：${analysis.visual_cues.trim()}`);
  }
  return parts.join("\n");
}

export function buildSummarizeIntentPrompt(input: {
  analysis: ReferenceAnalysis;
  user_context: string;
}): string {
  return `根据参考素材客观分析与用户说明，归纳「如何借鉴」意图。

参考分析：
${formatAnalysisContext(input.analysis)}

用户说明（仅供理解，输出不要复述原话）：
${input.user_context.trim()}

输出要求：
- summary：1–2 句说明希望借鉴的要点
- status：固定为 confirmed`;
}
