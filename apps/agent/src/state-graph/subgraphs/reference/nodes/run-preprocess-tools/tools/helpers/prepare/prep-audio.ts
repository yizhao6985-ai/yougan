import {
  fetchReferenceAssetBuffer,
  isPublicReferenceAssetUrl,
  referenceAssetFileExtension,
} from "./asset-fetch.js";

export type ReferenceAudioPrep = {
  audio_data?: string;
  audio_format?: string;
  notes: string[];
};

/** 下载音频并转为 data URL，避免模型无法访问内网/鉴权 URL。 */
export async function prepareReferenceAudio(
  url: string,
  mimeType: string,
  originalName?: string | null,
): Promise<ReferenceAudioPrep> {
  const notes: string[] = [];
  const format = referenceAssetFileExtension(mimeType, originalName);

  try {
    const buffer = await fetchReferenceAssetBuffer(url);
    const mime = mimeType.split(";")[0]?.trim() || "audio/wav";
    return {
      audio_data: `data:${mime};base64,${buffer.toString("base64")}`,
      audio_format: format,
      notes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notes.push(`音频下载失败：${message}`);

    if (isPublicReferenceAssetUrl(url)) {
      notes.push("已回退为原始 URL，模型可能无法访问该地址。");
      return { audio_data: url, audio_format: format, notes };
    }

    return { notes, audio_format: format };
  }
}
