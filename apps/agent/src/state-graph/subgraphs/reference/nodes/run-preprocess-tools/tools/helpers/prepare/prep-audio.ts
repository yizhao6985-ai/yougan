import { transcribeRemoteMedia } from "#agent/llm/providers/dashscope-asr.js";

import { isPublicReferenceAssetUrl } from "./asset-fetch.js";
import type { ReferenceAudioPrep } from "./types.js";

export async function prepareReferenceAudio(
  url: string,
): Promise<ReferenceAudioPrep> {
  const notes: string[] = [];

  if (!isPublicReferenceAssetUrl(url)) {
    notes.push(
      "素材 URL 非公网可访问，跳过 ASR（本地开发需配置可公网访问的 PUBLIC_BASE_URL）",
    );
    return { notes };
  }

  try {
    const transcript = await transcribeRemoteMedia(url);
    return {
      transcript: transcript.trim() || undefined,
      notes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notes.push(`ASR 转写失败：${message}`);
    return { notes };
  }
}
