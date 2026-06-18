import {
  fetchReferenceAssetBuffer,
  isPublicReferenceAssetUrl,
} from "./asset-fetch.js";

export type ReferenceImagePrep = {
  image_url?: string;
  notes: string[];
};

/** 下载图片并转为 data URL，避免模型无法访问内网/鉴权 URL。 */
export async function prepareReferenceImage(
  url: string,
  mimeType: string,
): Promise<ReferenceImagePrep> {
  const notes: string[] = [];

  try {
    const buffer = await fetchReferenceAssetBuffer(url);
    const mime = mimeType.split(";")[0]?.trim() || "image/jpeg";
    return {
      image_url: `data:${mime};base64,${buffer.toString("base64")}`,
      notes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notes.push(`图片下载失败：${message}`);

    if (isPublicReferenceAssetUrl(url)) {
      notes.push("已回退为原始 URL，模型可能无法访问该地址。");
      return { image_url: url, notes };
    }

    return { notes };
  }
}
