export const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: "小红书",
  weibo: "微博",
  wechat: "微信公众号",
  douyin: "抖音",
  kuaishou: "快手",
  bilibili: "哔哩哔哩",
  yougan: "有感",
};

export function platformLabel(platform: string | null | undefined) {
  if (!platform || platform === "castflow") return "有感";
  return PLATFORM_LABELS[platform] ?? platform;
}

export function formatPublishedAt(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
