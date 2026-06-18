import type { ContentFormatId } from "../models/taxonomy/content.js";
import type { MediaModalityId } from "../models/taxonomy/content.js";

/** MiniMax image-01 支持的 aspect_ratio */
export const MINIMAX_IMAGE_ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "4:3",
  "3:2",
  "2:3",
  "3:4",
  "9:16",
  "21:9",
] as const;

export type MiniMaxImageAspectRatio =
  (typeof MINIMAX_IMAGE_ASPECT_RATIOS)[number];

const MINIMAX_RATIO_SET = new Set<string>(MINIMAX_IMAGE_ASPECT_RATIOS);

export type AspectRatioContext = {
  format?: ContentFormatId | null;
  modalities?: MediaModalityId[];
};

function inferAspectRatioFromModalities(
  modalities: MediaModalityId[] | undefined,
): string | undefined {
  const set = new Set(modalities ?? []);
  if (set.has("video") && !set.has("image")) return "9:16";
  if (set.has("image") && set.has("text")) return "3:4";
  if (set.has("image")) return "3:4";
  return undefined;
}

function inferAspectRatioFromFormat(
  format: ContentFormatId | null | undefined,
): string | undefined {
  switch (format) {
    case "illustration":
    case "note":
      return "3:4";
    case "short_video":
      return "9:16";
    case "video_script":
      return "16:9";
    case "article":
    case "blog":
      return "16:9";
    default:
      return undefined;
  }
}

/**
 * 写入方案前规范化 aspect_ratio：已是 MiniMax 比例 id 则原样保留；
 * 中文描述才映射为比例（如「竖屏」→ 9:16）。
 */
export function normalizeProfileAspectRatio(
  value: string | null | undefined,
  _ctx: AspectRatioContext = {},
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (MINIMAX_RATIO_SET.has(trimmed)) return trimmed;

  if (/手机截图|截图画幅|屏幕截图|屏摄|screenshot/i.test(trimmed)) {
    return "9:16";
  }
  if (/短视频|竖屏视频|竖屏|抖音|快手/i.test(trimmed)) return "9:16";
  if (/横屏|宽屏|封面/i.test(trimmed)) return "16:9";
  if (/方图|正方形/i.test(trimmed)) return "1:1";

  return trimmed;
}

/** 无显式 media_params 时，按体裁与媒介组合推断默认画幅 */
export function inferProfileAspectRatio(ctx: AspectRatioContext): string {
  return (
    inferAspectRatioFromModalities(ctx.modalities) ??
    inferAspectRatioFromFormat(ctx.format) ??
    "1:1"
  );
}

export function normalizeMiniMaxAspectRatio(
  value: string | null | undefined,
): MiniMaxImageAspectRatio {
  const trimmed = value?.trim();
  if (trimmed && MINIMAX_RATIO_SET.has(trimmed)) {
    return trimmed as MiniMaxImageAspectRatio;
  }
  return "1:1";
}
