import { inferMediaKind, type Asset } from "@yougan/domain";

import type { ReferenceAnalyzeRequest } from "./types.js";
import { prepareReferenceAudio } from "./prep-audio.js";
import { prepareReferenceText } from "./prep-text.js";
import { prepareReferenceVideo } from "./prep-video.js";
import type { ReferenceAssetPrep } from "./types.js";

function referenceAssetDescriptor(asset: Asset): string {
  const name = asset.original_name?.trim();
  const parts = [
    name ? `文件名：${name}` : null,
    `类型：${asset.mime_type}`,
    `地址：${asset.url}`,
  ].filter(Boolean);
  return parts.join("\n");
}

export async function prepareReferenceIngest(
  request: ReferenceAnalyzeRequest,
): Promise<ReferenceAssetPrep> {
  const asset = request.asset;
  const mediaKind = inferMediaKind(asset.mime_type);
  const url = asset.url.trim();
  const notes: string[] = [];

  const prep: ReferenceAssetPrep = {
    media_kind: mediaKind,
    descriptor: referenceAssetDescriptor(asset),
    notes,
  };

  if (mediaKind === "text") {
    try {
      prep.text_excerpt = await prepareReferenceText(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notes.push(`文本读取失败：${message}`);
    }
    return prep;
  }

  if (mediaKind === "image") {
    prep.image_url = url;
    return prep;
  }

  if (mediaKind === "audio") {
    const result = await prepareReferenceAudio(url);
    notes.push(...result.notes);
    prep.transcript = result.transcript;
    return prep;
  }

  if (mediaKind === "video") {
    const result = await prepareReferenceVideo(url, asset);
    notes.push(...result.notes);
    prep.transcript = result.transcript;
    prep.video_frames = result.frames;
    return prep;
  }

  notes.push("未识别的文件类型，仅使用元数据");
  return prep;
}
