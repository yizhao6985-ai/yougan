import { Link } from "react-router-dom";

import { MarketingFeatureCard } from "@/components/marketing/marketing-feature-card";
import {
  MarketingPageFooter,
  MarketingPageShell,
  MarketingSection,
} from "@/components/marketing/marketing-page-layout";
import { SiteHeader } from "@/components/site-header";
import {
  HOME_FEATURE_TEASERS,
  STUDIO_CAPABILITIES,
} from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { HOME } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function HomePage() {
  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <MarketingPageShell className="relative flex flex-col justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 overflow-hidden"
        >
          <div className="absolute -top-20 left-1/2 size-80 -translate-x-1/2 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-900/20" />
          <div className="absolute top-8 right-[10%] size-56 rounded-full bg-amber-100/40 blur-3xl dark:bg-amber-950/15" />
        </div>

        <header className={scene.pageHeaderWide}>
          <p className={scene.pageEyebrow}>{HOME.eyebrow}</p>
          <h1 className={cn("mt-4 max-w-4xl", scene.pageTitleHero)}>
            {HOME.title}
            <span className="mt-3 block text-3xl font-semibold text-foreground/90 sm:text-4xl">
              {HOME.titleSuffix}
            </span>
          </h1>
          <p className={cn("mt-6 max-w-2xl", scene.pageSubtitle)}>
            {HOME.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/studio" className={scene.ctaPrimary}>
              {HOME.ctaStudio}
            </Link>
            <Link to="/features" className={scene.ctaSecondary}>
              {HOME.ctaFeatures}
            </Link>
          </div>
        </header>

        <MarketingSection
          className="mt-24"
          title={HOME.capabilitiesTitle}
          action={
            <Link to="/features" className={scene.link}>
              {HOME.capabilitiesLink}
            </Link>
          }
        >
          <div className={scene.contentGrid3}>
            {HOME_FEATURE_TEASERS.map((item, index) => {
              const Icon = STUDIO_CAPABILITIES[index]?.icon;
              return (
                <MarketingFeatureCard
                  key={item.title}
                  icon={Icon}
                  title={item.title}
                  body={item.body}
                  href={item.href}
                />
              );
            })}
          </div>
        </MarketingSection>
      </MarketingPageShell>
    </div>
  );
}
