import type { Asset } from "@yougan/domain";

import {
  fetchReferenceAssetBuffer,
  referenceAssetFileExtension,
} from "./asset-fetch.js";
import { extractReferenceVideoKeyframes } from "./asset-keyframes.js";
import { prepareReferenceAudio } from "./prep-audio.js";
import type { ReferenceVideoPrep } from "./types.js";

export async function prepareReferenceVideo(
  url: string,
  asset: Pick<Asset, "mime_type" | "original_name">,
): Promise<ReferenceVideoPrep> {
  const notes: string[] = [];

  const [audio, frames] = await Promise.all([
    prepareReferenceAudio(url),
    (async () => {
      try {
        return await extractReferenceVideoKeyframes({
          url,
          extension: referenceAssetFileExtension(
            asset.mime_type,
            asset.original_name,
          ),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        notes.push(`视频抽帧失败：${message}`);
        return [] as Buffer[];
      }
    })(),
  ]);

  notes.push(...audio.notes);

  if (!frames.length) {
    try {
      await fetchReferenceAssetBuffer(url);
    } catch {
      notes.push("无法下载视频文件，仅保留元数据与转写结果");
    }
  }

  return {
    transcript: audio.transcript,
    frames,
    notes,
  };
}
