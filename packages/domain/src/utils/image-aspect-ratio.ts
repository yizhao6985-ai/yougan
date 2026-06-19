import type { WorkProfile } from "../models/work/profile.js";
import {
  inferProfileAspectRatio,
  normalizeProfileAspectRatio,
  type AspectRatioContext,
} from "./aspect-ratio.js";
import { imageAspectRatioFromMediaParams } from "./work/content-form-media-params.js";
import {
  inferModalitiesFromProfile,
  parseProfileJson,
  resolveContentFormFromProfile,
  resolveMediaParamsFromProfile,
} from "./work/profile.js";

function profileNeedsImageAspectRatio(profile: WorkProfile): boolean {
  const contentForm = resolveContentFormFromProfile(profile);
  return (
    contentForm.modalities.includes("image") ||
    contentForm.format === "illustration" ||
    contentForm.format === "short_video" ||
    contentForm.format === "video_script"
  );
}

function aspectRatioContextFromProfile(
  profile: WorkProfile,
): AspectRatioContext {
  const contentForm = resolveContentFormFromProfile(profile);
  return {
    format: contentForm.format,
    modalities: contentForm.modalities,
  };
}

/**
 * 解析 design 出图应使用的画幅比例 id。
 * 运行时从 format 推断；context/sequence 中的画幅描述由 LLM 理解。
 */
export function resolveImageAspectRatio(profile: WorkProfile): string {
  const normalized = parseProfileJson(profile);
  const ctx = aspectRatioContextFromProfile(normalized);
  const mediaParams = resolveMediaParamsFromProfile(normalized);
  const explicit = imageAspectRatioFromMediaParams(mediaParams, ctx);
  if (explicit) {
    return (
      normalizeProfileAspectRatio(explicit, ctx) ?? inferProfileAspectRatio(ctx)
    );
  }

  if (!profileNeedsImageAspectRatio(normalized)) {
    return "1:1";
  }

  return inferProfileAspectRatio(ctx);
}

export function profileImageModalities(profile: WorkProfile) {
  return inferModalitiesFromProfile(parseProfileJson(profile));
}
