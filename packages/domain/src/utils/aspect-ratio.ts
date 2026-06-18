import type { ContentFormatId } from "../models/taxonomy/content.js";
import type { MediaModalityId } from "../models/taxonomy/content.js";

/** 设计出图支持的画幅比例 id */
export const DESIGN_IMAGE_ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "4:3",
  "3:2",
  "2:3",
  "3:4",
  "9:16",
  "21:9",
] as const;

export type DesignImageAspectRatio =
  (typeof DESIGN_IMAGE_ASPECT_RATIOS)[number];

const DESIGN_RATIO_SET = new Set<string>(DESIGN_IMAGE_ASPECT_RATIOS);

/** qwen-image size：宽*高，总像素在 512²–2048² 之间 */
const QWEN_IMAGE_SIZE_BY_RATIO: Record<DesignImageAspectRatio, string> = {
  "1:1": "2048*2048",
  "16:9": "2048*1152",
  "4:3": "2048*1536",
  "3:2": "2048*1365",
  "2:3": "1365*2048",
  "3:4": "1536*2048",
  "9:16": "1152*2048",
  "21:9": "2048*878",
};

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
 * 写入方案前规范化 aspect_ratio：已是合法比例 id 则原样保留；
 * 中文描述才映射为比例（如「竖屏」→ 9:16）。
 */
export function normalizeProfileAspectRatio(
  value: string | null | undefined,
  _ctx: AspectRatioContext = {},
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (DESIGN_RATIO_SET.has(trimmed)) return trimmed;

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

export function normalizeDesignImageAspectRatio(
  value: string | null | undefined,
): DesignImageAspectRatio {
  const trimmed = value?.trim();
  if (trimmed && DESIGN_RATIO_SET.has(trimmed)) {
    return trimmed as DesignImageAspectRatio;
  }
  return "1:1";
}

/** 将画幅比例 id 转为百炼 qwen-image 的 size 参数 */
export function aspectRatioToQwenImageSize(
  ratio: string | null | undefined,
): string {
  const normalized = normalizeDesignImageAspectRatio(ratio);
  return QWEN_IMAGE_SIZE_BY_RATIO[normalized];
}
