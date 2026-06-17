import type { WorkProfile } from "../models/work/profile.js";
import {
  aspectRatioFromParams,
  inferProfileAspectRatio,
  normalizeProfileAspectRatio,
  type AspectRatioContext,
} from "./aspect-ratio.js";
import { resolveDelivery } from "./delivery.js";

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
    platform: delivery.platform,
    format: delivery.format,
  };
}

/**
 * 解析 design 出图应使用的 MiniMax aspect_ratio。
 * 显式 params 经语义规范化；否则按平台/体裁推断。
 */
export function resolveImageAspectRatio(profile: WorkProfile): string {
  const ctx = aspectRatioContextFromProfile(profile);
  const explicit = aspectRatioFromParams(profile.delivery.params);
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
