import { KNOWN_PLATFORMS } from "../models/platform.js";

const PLATFORM_ALIASES: Record<string, string> = {
  小红书: "xiaohongshu",
  微博: "weibo",
  推特: "twitter",
  "twitter/x": "twitter",
  x: "twitter",
  领英: "linkedin",
  instagram: "instagram",
  ins: "instagram",
  微信公众号: "wechat",
  公众号: "wechat",
  抖音: "douyin",
  快手: "kuaishou",
  bilibili: "bilibili",
  哔哩哔哩: "bilibili",
  b站: "bilibili",
};

export function normalizePlatform(platform: string): string {
  const key = platform.trim().toLowerCase();
  if ((KNOWN_PLATFORMS as readonly string[]).includes(key)) return key;
  return PLATFORM_ALIASES[key] ?? key;
}
