import {
  inferMediaKind,
  type ReferenceContent,
} from "@yougan/domain";

import { transcribeRemoteMedia } from "#agent/llm/providers/dashscope-asr.js";

import { describeImageBuffers, describeImageUrl } from "./describe-vision.js";
import {
  fetchAssetBuffer,
  fileExtensionFromAsset,
  isLikelyPublicAssetUrl,
} from "./fetch-asset.js";
import type { ReferencePerceptionBundle } from "./types.js";
import { extractVideoKeyframeBuffers } from "./video-keyframes.js";

function assetDescriptor(content: Extract<ReferenceContent, { kind: "asset" }>) {
  const { asset } = content;
  const name = asset.original_name?.trim();
  const parts = [
    name ? `文件名：${name}` : null,
    `类型：${asset.mime_type}`,
    `地址：${asset.url}`,
  ].filter(Boolean);
  return parts.join("\n");
}

async function tryTranscribe(
  url: string,
  notes: string[],
): Promise<string | undefined> {
  if (!isLikelyPublicAssetUrl(url)) {
    notes.push("素材 URL 非公网可访问，跳过 ASR（本地开发需配置可公网访问的 PUBLIC_BASE_URL）");
    return undefined;
  }

  try {
    const transcript = await transcribeRemoteMedia(url);
    return transcript.trim() || undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notes.push(`ASR 转写失败：${message}`);
    return undefined;
  }
}

export async function perceiveReference(input: {
  content: ReferenceContent;
  assetUrl?: string | null;
  user_context?: string | null;
}): Promise<ReferencePerceptionBundle> {
  const notes: string[] = [];
  const userContext = input.user_context?.trim() || null;

  if (input.content.kind === "text") {
    return {
      media_kind: "text",
      user_context: userContext,
      source_text: input.content.text.trim(),
    };
  }

  const { asset } = input.content;
  const mediaKind = inferMediaKind(asset.mime_type);
  const descriptor = assetDescriptor(input.content);
  const resolvedUrl = input.assetUrl?.trim() || asset.url.trim();

  const bundle: ReferencePerceptionBundle = {
    media_kind: mediaKind,
    user_context: userContext,
    descriptor,
    perception_notes: notes,
  };

  if (mediaKind === "image") {
    try {
      bundle.visual_description = await describeImageUrl(resolvedUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notes.push(`图片视觉感知失败：${message}`);
    }
    return bundle;
  }

  if (mediaKind === "audio") {
    bundle.transcript = await tryTranscribe(resolvedUrl, notes);
    return bundle;
  }

  if (mediaKind === "video") {
    const [transcript, frames] = await Promise.all([
      tryTranscribe(resolvedUrl, notes),
      (async () => {
        try {
          return await extractVideoKeyframeBuffers({
            url: resolvedUrl,
            extension: fileExtensionFromAsset(
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

    bundle.transcript = transcript;

    if (frames.length > 0) {
      try {
        bundle.visual_description = await describeImageBuffers(frames);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        notes.push(`视频画面感知失败：${message}`);
      }
    } else {
      try {
        await fetchAssetBuffer(resolvedUrl);
      } catch {
        notes.push("无法下载视频文件，仅保留元数据与转写结果");
      }
    }

    return bundle;
  }

  notes.push("未识别的文件类型，仅使用元数据");
  return bundle;
}
