import { HumanMessage } from "@langchain/core/messages";

import type { ReferenceAssetPrep } from "../prepare/types.js";

function notesBlock(notes: string[]): string {
  if (!notes.length) return "";
  return `处理备注：\n${notes.map((n) => `- ${n}`).join("\n")}\n\n`;
}

const ANALYZE_INSTRUCTIONS = `请客观分析参考素材的内容、风格、结构与可借鉴要点（仅输出 analysis 字段）。
- 图片素材的 visual_cues 请填写视觉要点摘要`;

function mediaInstruction(mediaKind: ReferenceAssetPrep["media_kind"]): string {
  switch (mediaKind) {
    case "text":
      return "请阅读下方参考原文并完成分析。";
    case "image":
      return "请直接观察下方图片并完成分析。";
    default:
      return "请基于文件信息保守分析。";
  }
}

export function buildAnalyzeReferenceMessage(
  prep: ReferenceAssetPrep,
): HumanMessage {
  const header = `${ANALYZE_INSTRUCTIONS}\n\n${mediaInstruction(prep.media_kind)}\n\n文件信息：\n${prep.descriptor}\n\n${notesBlock(prep.notes)}`;

  if (prep.media_kind === "text") {
    return new HumanMessage(
      `${header}参考原文：\n${prep.text_excerpt?.trim() || "（无法读取原文）"}`,
    );
  }

  if (prep.media_kind === "image") {
    if (prep.image_url) {
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

    return new HumanMessage(
      `${header}（未能加载图片内容，请主要依据文件信息保守分析）`,
    );
  }

  return new HumanMessage(header);
}
