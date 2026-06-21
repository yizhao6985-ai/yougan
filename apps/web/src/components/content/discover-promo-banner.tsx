import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import {
  dismissDiscoverBanner,
  getActiveDiscoverBanners,
  isDiscoverBannerDismissed,
  type DiscoverBanner,
} from "@/lib/discover-banners";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { cn } from "@/lib/utils";

function BannerLink({
  banner,
  className,
  children,
}: {
  banner: DiscoverBanner;
  className?: string;
  children: ReactNode;
}) {
  if (banner.external || banner.href.startsWith("http")) {
    return (
      <a
        href={banner.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={banner.href} className={className}>
      {children}
    </Link>
  );
}

export function DiscoverPromoBanner() {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() =>
    getActiveDiscoverBanners()
      .map((item) => item.id)
      .filter((id) => isDiscoverBannerDismissed(id)),
  );

  const visibleBanners = useMemo(
    () =>
      getActiveDiscoverBanners().filter(
        (banner) => !dismissedIds.includes(banner.id),
      ),
    [dismissedIds],
  );

  const [index, setIndex] = useState(0);
  const banner = visibleBanners[index] ?? visibleBanners[0];

  if (!banner) return null;

  const handleDismiss = () => {
    dismissDiscoverBanner(banner.id);
    setDismissedIds((current) =>
      current.includes(banner.id) ? current : [...current, banner.id],
    );
  };

  const hasMultiple = visibleBanners.length > 1;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-accent/45 px-3 py-2 ring-1 ring-primary/10 sm:px-4">
      {hasMultiple ? (
        <button
          type="button"
          onClick={() =>
            setIndex(
              (current) =>
                (current - 1 + visibleBanners.length) % visibleBanners.length,
            )
          }
          className="hidden shrink-0 rounded-md p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground sm:inline-flex"
          aria-label="上一条活动"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        {banner.eyebrow ? (
          <span className="hidden shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary sm:inline">
            {banner.eyebrow}
          </span>
        ) : null}
        <p className="min-w-0 truncate text-foreground/90">
          <span className="font-medium text-foreground">{banner.title}</span>
          <span className="hidden text-muted-foreground sm:inline">
            {" "}
            · {banner.description}
          </span>
        </p>
        <BannerLink
          banner={banner}
          className="ml-auto shrink-0 text-sm font-medium text-primary hover:text-primary/85"
        >
          {banner.ctaLabel}
        </BannerLink>
      </div>

      {hasMultiple ? (
        <button
          type="button"
          onClick={() =>
            setIndex((current) => (current + 1) % visibleBanners.length)
          }
          className="hidden shrink-0 rounded-md p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground sm:inline-flex"
          aria-label="下一条活动"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground/70 hover:bg-background/60 hover:text-foreground"
        aria-label={DISCOVER_SECTION.dismissBanner}
      >
        <XIcon className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
