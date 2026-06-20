import type { MediaKind, ReferenceAnalysis } from "@yougan/domain";
import { invokeMultimodalStructured } from "#agent/llm/invoke/index.js";
import { createMultimodalChatModel } from "#agent/llm/providers/index.js";

import type { ReferenceAssetPrep } from "../prepare/types.js";
import { buildAnalyzeReferenceMessage } from "./analyze-prompt.js";
import { ReferenceContentAnalyzeSchema } from "./analyze-schema.js";

const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  text: "文本",
  image: "图片",
  audio: "音频",
  video: "视频",
  file: "素材",
};

function buildFallbackReferenceAnalysis(
  prep: ReferenceAssetPrep,
): ReferenceAnalysis {
  const kindLabel = MEDIA_KIND_LABELS[prep.media_kind] ?? "素材";
  const note =
    prep.notes.find((entry) => entry.trim().length > 0)?.trim() ??
    "模型未能返回有效分析结果";
  return {
    summary: `${kindLabel}参考素材已上传，自动分析暂未完成（${note}）。请在对话中补充希望借鉴的风格、结构或语气。`,
  };
}

function finalizeReferenceAnalysis(
  parsed: ReferenceAnalysis,
  prep: ReferenceAssetPrep,
): ReferenceAnalysis {
  return {
    ...parsed,
    summary: parsed.summary.trim(),
    visual_cues: parsed.visual_cues?.trim() || undefined,
    transcript:
      parsed.transcript?.trim() || undefined,
  };
}

export async function analyzeReferenceContent(
  prep: ReferenceAssetPrep,
): Promise<ReferenceAnalysis> {
  const llm = createMultimodalChatModel({ temperature: 0.2 });

  try {
    const parsed = await invokeMultimodalStructured(
      llm,
      ReferenceContentAnalyzeSchema,
      [buildAnalyzeReferenceMessage(prep)],
      { name: "reference_analyze_content" },
    );

    if (!parsed?.summary?.trim()) {
      return buildFallbackReferenceAnalysis(prep);
    }

    return finalizeReferenceAnalysis(parsed, prep);
  } catch (error) {
    console.error("[reference] analyze content failed", error);
    return buildFallbackReferenceAnalysis(prep);
  }
}
