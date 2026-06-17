import type { ContentFormatId } from "../models/taxonomy/content.js";
import type { FormatParams } from "../models/work/profile.js";
import {
  DISCOVER_PLATFORMS,
  type DiscoverPlatformId,
} from "../models/taxonomy/discover.js";

/** 从 params 读取显式画幅（illustration / video / text 均可携带） */
export function aspectRatioFromParams(
  params: FormatParams,
): string | undefined {
  if (!("aspect_ratio" in params)) return undefined;
  const trimmed = params.aspect_ratio?.trim();
  return trimmed || undefined;
}

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
  platform?: string | null;
  format?: ContentFormatId | null;
};

/** 将自由文本平台名（如「小红书」）匹配为 discover platform id */
export function matchDiscoverPlatformId(
  platform: string | null | undefined,
): DiscoverPlatformId | null {
  const raw = platform?.trim();
  if (!raw) return null;

  for (const item of DISCOVER_PLATFORMS) {
    if (raw === item.id || raw === item.label) return item.id;
  }

  const lower = raw.toLowerCase();
  if (/小红书|xhs|redbook/i.test(raw)) return "xiaohongshu";
  if (/抖音|douyin/i.test(raw)) return "douyin";
  if (/快手|kuaishou/i.test(raw)) return "kuaishou";
  if (/微博|weibo/i.test(raw)) return "weibo";
  if (/微信|公众号|wechat/i.test(raw)) return "wechat";
  if (/哔哩|bilibili|b站/i.test(raw)) return "bilibili";
  if (/有感|yougan/i.test(lower)) return "yougan";

  for (const item of DISCOVER_PLATFORMS) {
    if (raw.includes(item.label) || lower.includes(item.id)) return item.id;
  }

  return null;
}

function inferAspectRatioFromPlatform(
  platform: string | null | undefined,
  format?: ContentFormatId | null,
): string | undefined {
  const platformId = matchDiscoverPlatformId(platform);
  if (!platformId) return undefined;

  switch (platformId) {
    case "douyin":
    case "kuaishou":
      return "9:16";
    case "xiaohongshu":
      return "3:4";
    case "bilibili":
    case "wechat":
      return format === "short_video" ? "9:16" : "16:9";
    default:
      return undefined;
  }
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
 * 中文描述才映射为比例（如「手机截图」→ 9:16）。
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

/** 无显式 params 时，按平台/体裁推断默认画幅 */
export function inferProfileAspectRatio(ctx: AspectRatioContext): string {
  return (
    inferAspectRatioFromPlatform(ctx.platform, ctx.format) ??
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
