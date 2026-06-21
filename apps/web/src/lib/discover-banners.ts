/** 发现页运营 Banner：改此文件即可上下线活动，无需动组件 */
export type DiscoverBannerTone = "primary" | "warm" | "neutral";

export type DiscoverBanner = {
  id: string;
  enabled: boolean;
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel: string;
  /** 站内路径或完整 URL */
  href: string;
  external?: boolean;
  imageUrl?: string | null;
  tone?: DiscoverBannerTone;
  /** ISO 8601，可选排期 */
  startsAt?: string;
  endsAt?: string;
};

export const DISCOVER_BANNERS: DiscoverBanner[] = [
  {
    id: "spring-create-challenge",
    enabled: true,
    eyebrow: "限时活动",
    title: "春季创作挑战",
    description:
      "在创作台完成一件作品并发布到有感，优质内容有机会进入发现页精选推荐。",
    ctaLabel: "去创作",
    href: "/studio",
    tone: "primary",
  },
  {
    id: "discover-publish-guide",
    enabled: true,
    eyebrow: "新手指南",
    title: "第一次发布？",
    description: "了解如何从成稿到发布、为作品配上列表封面，在公域被更多人看见。",
    ctaLabel: "查看指南",
    href: "/features#publish-heading",
    tone: "neutral",
  },
];

export function getActiveDiscoverBanners(
  now: Date = new Date(),
): DiscoverBanner[] {
  return DISCOVER_BANNERS.filter((banner) => {
    if (!banner.enabled) return false;
    if (banner.startsAt && new Date(banner.startsAt) > now) return false;
    if (banner.endsAt && new Date(banner.endsAt) < now) return false;
    return true;
  });
}

export const DISCOVER_BANNER_DISMISS_KEY = "yougan:discover-banner-dismissed";

export function isDiscoverBannerDismissed(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISCOVER_BANNER_DISMISS_KEY);
    if (!raw) return false;
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) && ids.includes(id);
  } catch {
    return false;
  }
}

export function dismissDiscoverBanner(id: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(DISCOVER_BANNER_DISMISS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    if (!Array.isArray(ids)) return;
    if (!ids.includes(id)) {
      localStorage.setItem(
        DISCOVER_BANNER_DISMISS_KEY,
        JSON.stringify([...ids, id]),
      );
    }
  } catch {
    // ignore quota / private mode
  }
}
