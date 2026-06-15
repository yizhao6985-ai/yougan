import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  DownloadIcon,
  SparklesIcon,
  SmartphoneIcon,
  ZapIcon,
} from "lucide-react";

import { DownloadQr } from "@/components/download-qr";
import { MarketingFeatureCard } from "@/components/marketing/marketing-feature-card";
import {
  MarketingBackLink,
  MarketingPageFooter,
  MarketingPageHeader,
  MarketingPageShell,
  MarketingSection,
} from "@/components/marketing/marketing-page-layout";
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
    <article className={cn(scene.surface, "flex flex-col items-center p-8")}>
      <p className={scene.pageEyebrow}>{platform}</p>
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
          className={cn(
            "mt-4 inline-flex items-center gap-2",
            scene.ctaPrimary,
            "px-5 py-2.5",
          )}
        >
          <DownloadIcon className="size-4" aria-hidden />
          直接下载
        </a>
      ) : (
        <p className="mt-4 text-center text-xs text-amber-700/90 dark:text-amber-300/90">
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

      <MarketingPageShell>
        <MarketingBackLink to="/" className="mb-8">
          <ArrowLeftIcon className="size-4" aria-hidden />
          {MOBILE_PAGE.back}
        </MarketingBackLink>

        <MarketingPageHeader
          eyebrow={MOBILE_PAGE.eyebrow}
          title={MOBILE_PAGE.title}
          subtitle={MOBILE_PAGE.subtitle}
          wide
        />

        <div className={cn("mt-12", scene.sectionStack)}>
          <MarketingSection>
            <div className={scene.contentGrid3}>
              {MOBILE_PAGE.features.map(({ title, body }, index) => {
                const Icon = FEATURE_ICONS[index] ?? SparklesIcon;
                return (
                  <MarketingFeatureCard
                    key={title}
                    icon={Icon}
                    title={title}
                    body={body}
                  />
                );
              })}
            </div>
          </MarketingSection>

          <MarketingSection
            title={MOBILE_PAGE.downloadTitle}
            hint={MOBILE_PAGE.downloadSubtitle}
            heading
            className="text-center [&_h2]:mx-auto [&_p]:mx-auto"
          >
            {!hasAny ? (
              <div className={cn(scene.surfaceInset, "mx-auto max-w-lg text-center")}>
                <p className="font-medium text-foreground">
                  {MOBILE_PAGE.downloadPendingTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-primary/80">
                  {MOBILE_PAGE.downloadPendingBody}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "mx-auto grid max-w-3xl gap-6",
                  hasIos && hasAndroid ? "sm:grid-cols-2" : "max-w-sm",
                )}
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
          </MarketingSection>
        </div>

        <MarketingPageFooter className="mt-16">
          <Link to="/studio" className={scene.ctaPrimary}>
            {MOBILE_PAGE.ctaStudio}
          </Link>
          <Link to="/features" className={scene.ctaSecondary}>
            {MOBILE_PAGE.ctaFeatures}
          </Link>
        </MarketingPageFooter>
      </MarketingPageShell>
    </div>
  );
}
