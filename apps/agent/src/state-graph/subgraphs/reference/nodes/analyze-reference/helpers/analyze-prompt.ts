import { HumanMessage } from "@langchain/core/messages";

import { referenceImagePartFromBuffer } from "./asset-image-part.js";
import type { ReferenceAssetPrep } from "./prep-types.js";

function contextBlock(userContext?: string | null): string {
  const context = userContext?.trim();
  return context
    ? `用户说明（仅供理解意图，输出不要复述原话）：\n${context}\n\n`
    : "用户未额外说明用途。\n\n";
}

function notesBlock(notes: string[]): string {
  if (!notes.length) return "";
  return `处理备注：\n${notes.map((n) => `- ${n}`).join("\n")}\n\n`;
}

const ANALYZE_INSTRUCTIONS = `请一次输出 analysis 与 intent 两部分：
- analysis：客观描述内容、风格、结构与可借鉴要点
- intent：用 1–2 句归纳用户想如何借鉴；若未说明用途，写保守归纳
- 音频/视频的 transcript 字段留空（系统会从 ASR 填入）；图片/视频的 visual_cues 请填写视觉要点摘要`;

function mediaInstruction(mediaKind: ReferenceAssetPrep["media_kind"]): string {
  switch (mediaKind) {
    case "text":
      return "请阅读下方参考原文并完成分析。";
    case "image":
      return "请直接观察下方图片并完成分析。";
    case "audio":
      return "请基于下方转写稿完成分析。";
    case "video":
      return "请结合下方转写稿（如有）与关键帧画面完成分析。";
    default:
      return "请基于文件信息保守分析。";
  }
}

export function buildAnalyzeReferenceMessage(
  prep: ReferenceAssetPrep,
): HumanMessage {
  const header = `${contextBlock(prep.user_context)}${ANALYZE_INSTRUCTIONS}\n\n${mediaInstruction(prep.media_kind)}\n\n文件信息：\n${prep.descriptor}\n\n${notesBlock(prep.notes)}`;

  if (prep.media_kind === "text") {
    return new HumanMessage(
      `${header}参考原文：\n${prep.text_excerpt?.trim() || "（无法读取原文）"}`,
    );
  }

  if (prep.media_kind === "image" && prep.image_url) {
    return new HumanMessage({
      content: [
        { type: "text", text: header },
        {
          type: "image_url",
          image_url: { url: prep.image_url },
        },
      ],
    });
  }

  if (prep.media_kind === "audio") {
    return new HumanMessage(
      `${header}转写稿：\n${prep.transcript?.trim() || "（无转写）"}`,
    );
  }

  if (prep.media_kind === "video") {
    const transcriptBlock = prep.transcript?.trim()
      ? `转写稿：\n${prep.transcript.trim()}\n\n`
      : "";
    const frames = prep.video_frames ?? [];

    if (frames.length > 0) {
      return new HumanMessage({
        content: [
          {
            type: "text",
            text: `${header}${transcriptBlock}以下是从参考视频中抽取的 ${frames.length} 个关键帧：`,
          },
          ...frames.map((frame) => referenceImagePartFromBuffer(frame)),
        ],
      });
    }

    return new HumanMessage(
      `${header}${transcriptBlock}（未能抽取关键帧，请主要依据转写稿分析）`,
    );
  }

  return new HumanMessage(header);
}
