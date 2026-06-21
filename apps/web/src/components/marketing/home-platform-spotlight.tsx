import { Link } from "react-router-dom";
import { ArrowRightIcon, CheckIcon, NewspaperIcon } from "lucide-react";

import { HOME_PLATFORM_HIGHLIGHTS } from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { DISCOVER_SECTION, HOME } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

const FEED_PREVIEWS = [
  { title: "城市漫步随笔", tag: "观点长文", hasThumb: false },
  { title: "品牌 IP 插画", tag: "插画绘画", hasThumb: true },
  { title: "产品测评口播", tag: "短视频脚本", hasThumb: false },
] as const;

export function HomePlatformSpotlight() {
  return (
    <Link
      to="/content"
      className={cn(
        scene.surfaceInteractive,
        "group grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]",
      )}
    >
      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent text-primary ring-1 ring-primary/10">
          <NewspaperIcon className="size-6" aria-hidden />
        </span>

        <h3 className="mt-6 text-2xl font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
          {DISCOVER_SECTION.title}
        </h3>
        <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
          {DISCOVER_SECTION.description}
        </p>

        <ul className="mt-8 space-y-3">
          {HOME_PLATFORM_HIGHLIGHTS.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 text-sm leading-6 text-muted-foreground"
            >
              <CheckIcon
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {HOME.platformCta}
          <ArrowRightIcon
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>

      <div
        aria-hidden
        className="relative border-t border-border/60 bg-gradient-to-br from-accent/30 via-card to-secondary/30 p-6 sm:p-8 lg:border-t-0 lg:border-l"
      >
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {DISCOVER_SECTION.featuredHeading}
        </p>
        <ul className="mt-4 space-y-3">
          {FEED_PREVIEWS.map((item, index) => (
            <li
              key={item.title}
              className={cn(
                "rounded-xl bg-card/90 p-4 ring-1 ring-border/50 transition-transform duration-300",
                index === 0 && "group-hover:-translate-y-0.5",
                index === 1 && "group-hover:translate-x-0.5",
              )}
            >
              <span className="text-[10px] font-medium text-primary">
                {item.tag}
              </span>
              <p className="mt-1.5 text-sm font-medium text-foreground">
                {item.title}
              </p>
              {item.hasThumb ? (
                <div className="mt-3 aspect-[16/9] rounded-lg bg-gradient-to-br from-emerald-200/70 via-accent/40 to-amber-100/50 ring-1 ring-border/40 dark:from-emerald-900/40 dark:via-accent/30 dark:to-amber-950/30" />
              ) : (
                <div className="mt-3 flex gap-1.5">
                  <span className="h-1.5 flex-1 rounded-full bg-primary/20" />
                  <span className="h-1.5 w-1/3 rounded-full bg-primary/10" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
