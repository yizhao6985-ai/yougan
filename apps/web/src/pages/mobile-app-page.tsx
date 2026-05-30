import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  DownloadIcon,
  SparklesIcon,
  SmartphoneIcon,
  ZapIcon,
} from "lucide-react";

import { DownloadQr } from "@/components/download-qr";
import { SiteHeader } from "@/components/site-header";
import { getMobileDownloadLinks } from "@/lib/mobile-app";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";
import { MOBILE_PAGE } from "@/lib/site-copy";

const FEATURE_ICONS = [SparklesIcon, ZapIcon, SmartphoneIcon] as const;

function DownloadCard({
  platform,
  url,
  hint,
}: {
  platform: "iOS" | "Android";
  url: string;
  hint: string;
}) {
  const storeLabel = platform === "iOS" ? "App Store" : "应用商店";

  return (
    <article className="flex flex-col items-center rounded-lg border border-border/80 bg-card/95 p-8 shadow-sm shadow-border/20 backdrop-blur">
      <p className="text-sm font-medium uppercase tracking-wider text-primary/90">
        {platform}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-foreground">{storeLabel}</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">{hint}</p>

      <div className="mt-8">
        <DownloadQr value={url} label={`${platform} 下载`} size={200} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {MOBILE_PAGE.downloadHint}
      </p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("mt-4 inline-flex items-center gap-2", scene.ctaPrimary, "px-5 py-2.5")}
        >
          <DownloadIcon className="size-4" aria-hidden />
          直接下载
        </a>
      ) : (
        <p className="mt-4 text-center text-xs text-amber-700/90">
          {MOBILE_PAGE.downloadAdminHint}
        </p>
      )}
    </article>
  );
}

export function MobileAppPage() {
  const { ios, android, hasIos, hasAndroid, hasAny } = getMobileDownloadLinks();

  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {MOBILE_PAGE.back}
        </Link>

        <p className="mt-8 text-sm uppercase tracking-[0.2em] text-primary/80">
          {MOBILE_PAGE.eyebrow}
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {MOBILE_PAGE.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {MOBILE_PAGE.subtitle}
        </p>

        <section className="mt-14 grid gap-6 sm:grid-cols-3">
          {MOBILE_PAGE.features.map(({ title, body }, index) => {
            const Icon = FEATURE_ICONS[index] ?? SparklesIcon;
            return (
              <article
                key={title}
                className="rounded-lg border border-border/80 bg-card/90 p-6 shadow-sm shadow-border/20"
              >
                <Icon className="size-6 text-primary" aria-hidden />
                <h2 className="mt-4 text-lg font-medium text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            {MOBILE_PAGE.downloadTitle}
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {MOBILE_PAGE.downloadSubtitle}
          </p>

          {!hasAny ? (
            <div className="mx-auto mt-10 max-w-lg rounded-lg border border-primary/20 bg-accent/60 px-6 py-8 text-center text-sm text-foreground/90">
              <p className="font-medium">{MOBILE_PAGE.downloadPendingTitle}</p>
              <p className="mt-2 leading-6 text-primary/80">
                {MOBILE_PAGE.downloadPendingBody}
              </p>
            </div>
          ) : (
            <div
              className={`mx-auto mt-10 grid max-w-3xl gap-8 ${
                hasIos && hasAndroid ? "sm:grid-cols-2" : "max-w-sm"
              }`}
            >
              {hasIos ? (
                <DownloadCard
                  platform="iOS"
                  url={ios}
                  hint="适用于 iPhone 与 iPad"
                />
              ) : null}
              {hasAndroid ? (
                <DownloadCard
                  platform="Android"
                  url={android}
                  hint="适用于 Android 手机与平板"
                />
              ) : null}
            </div>
          )}
        </section>

        <div className="mt-16 flex flex-wrap justify-center gap-4">
          <Link
            to="/studio"
            className={scene.ctaPrimary}
          >
            {MOBILE_PAGE.ctaStudio}
          </Link>
          <Link
            to="/features"
            className="rounded-lg border border-border bg-card/80 px-6 py-3 text-sm font-medium text-foreground/90 backdrop-blur transition hover:bg-card"
          >
            {MOBILE_PAGE.ctaFeatures}
          </Link>
        </div>
      </main>
    </div>
  );
}
