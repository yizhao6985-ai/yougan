import type { WorkProfile } from "../models/work/profile.js";
import {
  inferProfileAspectRatio,
  normalizeProfileAspectRatio,
  type AspectRatioContext,
} from "./aspect-ratio.js";
import { imageAspectRatioFromMediaParams } from "./work/delivery-media-params.js";
import {
  inferModalitiesFromProfile,
  parseProfileJson,
  resolveDeliveryFromProfile,
  resolveMediaParamsFromProfile,
} from "./work/profile.js";

function profileNeedsImageAspectRatio(profile: WorkProfile): boolean {
  const delivery = resolveDeliveryFromProfile(profile);
  return (
    delivery.modalities.includes("image") ||
    delivery.format === "illustration" ||
    delivery.format === "short_video" ||
    delivery.format === "video_script"
  );
}

function aspectRatioContextFromProfile(
  profile: WorkProfile,
): AspectRatioContext {
  const delivery = resolveDeliveryFromProfile(profile);
  return {
    format: delivery.format,
    modalities: delivery.modalities,
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
