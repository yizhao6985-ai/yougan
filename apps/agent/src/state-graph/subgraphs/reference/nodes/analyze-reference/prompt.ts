import type { ReferencePerceptionBundle } from "../../perception/types.js";

function perceptionBlock(bundle: ReferencePerceptionBundle): string {
  const blocks: string[] = [];

  if (bundle.source_text?.trim()) {
    blocks.push(`原文：\n${bundle.source_text.trim()}`);
  }
  if (bundle.transcript?.trim()) {
    blocks.push(`转写稿：\n${bundle.transcript.trim()}`);
  }
  if (bundle.visual_description?.trim()) {
    blocks.push(`视觉感知：\n${bundle.visual_description.trim()}`);
  }
  if (bundle.descriptor?.trim()) {
    blocks.push(`文件信息：\n${bundle.descriptor.trim()}`);
  }
  if (bundle.perception_notes?.length) {
    blocks.push(`感知备注：\n${bundle.perception_notes.map((n) => `- ${n}`).join("\n")}`);
  }

  return blocks.length ? `${blocks.join("\n\n")}\n\n` : "";
}

export function buildAnalyzeReferencePrompt(
  bundle: ReferencePerceptionBundle,
): string {
  const context = bundle.user_context?.trim();
  const contextBlock = context
    ? `用户说明（仅供理解意图，输出不要复述原话）：\n${context}\n\n`
    : "用户未额外说明用途。\n\n";

  const perceived = perceptionBlock(bundle);

  if (bundle.media_kind === "text") {
    return `${contextBlock}请基于以下参考文案，一次输出 analysis 与 intent 两部分：
- analysis：客观描述文案结构、语气、要点
- intent：用 1–2 句归纳用户想如何借鉴；若未说明用途，写保守归纳

${perceived}`;
  }

  if (bundle.media_kind === "image") {
    return `${contextBlock}请基于以下图片感知结果，一次输出 analysis 与 intent 两部分：
- analysis：客观描述画面内容、风格、构图、色调
- intent：用 1–2 句归纳用户想如何借鉴；若未说明用途，写保守归纳

${perceived}`;
  }

  if (bundle.media_kind === "audio") {
    return `${contextBlock}请基于以下音频感知结果（含转写稿），一次输出 analysis 与 intent：
- analysis：描述内容类型、情绪、节奏、语气与可借鉴要点
- intent：用 1–2 句归纳用户想如何借鉴

${perceived}`;
  }

  if (bundle.media_kind === "video") {
    return `${contextBlock}请基于以下视频感知结果（关键帧画面 + 可选转写稿），一次输出 analysis 与 intent：
- analysis：描述画面风格、叙事节奏、镜头语气与可借鉴要点
- intent：用 1–2 句归纳用户想如何借鉴

${perceived}`;
  }

  return `${contextBlock}请基于以下文件信息，一次输出 analysis 与 intent：
- analysis：保守描述可能用途与可借鉴点
- intent：用 1–2 句归纳用户想如何借鉴

${perceived}`;
}
