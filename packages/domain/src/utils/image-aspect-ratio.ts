import type { WorkProfile } from "../models/work/profile.js";
import {
  inferProfileAspectRatio,
  normalizeProfileAspectRatio,
  type AspectRatioContext,
} from "./aspect-ratio.js";
import { resolveDelivery } from "./delivery.js";
import { imageAspectRatioFromMediaParams } from "./work/delivery-media-params.js";

function profileNeedsImageAspectRatio(profile: WorkProfile): boolean {
  const delivery = resolveDelivery(profile.delivery);
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
  const delivery = resolveDelivery(profile.delivery);
  return {
    format: delivery.format,
    modalities: delivery.modalities,
  };
}

/**
 * 解析 design 出图应使用的 MiniMax aspect_ratio。
 * 显式 media_params.image 优先；否则按体裁/媒介推断。
 */
export function resolveImageAspectRatio(profile: WorkProfile): string {
  const ctx = aspectRatioContextFromProfile(profile);
  const explicit = imageAspectRatioFromMediaParams(
    profile.delivery.media_params,
    ctx,
  );
  if (explicit) {
    return (
      normalizeProfileAspectRatio(explicit, ctx) ?? inferProfileAspectRatio(ctx)
    );
  }

  if (!profileNeedsImageAspectRatio(profile)) {
    return "1:1";
  }

  return inferProfileAspectRatio(ctx);
}
