import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { FeaturesAnchorNav } from "@/components/marketing/features-anchor-nav";
import {
  FeaturesCapabilityDetail,
  FeaturesStudioFlow,
} from "@/components/marketing/features-capability-detail";
import { HomeFeatureChapter } from "@/components/marketing/home-feature-chapter";
import { HomePlatformSpotlight } from "@/components/marketing/home-platform-spotlight";
import {
  MarketingBackLink,
  MarketingPageFooter,
  MarketingPageHeader,
  MarketingPageShell,
} from "@/components/marketing/marketing-page-layout";
import { SiteHeader } from "@/components/site-header";
import {
  EXTRA_CAPABILITIES,
  FEATURES_ANCHOR_LINKS,
  FEATURES_LIFECYCLE_CAPABILITIES,
  PRODUCTION_FORMS,
  STUDIO_CAPABILITIES,
  STUDIO_PANELS,
} from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { FEATURES_PAGE } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function FeaturesPageBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.28] dark:opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "3.5rem 3.5rem",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
        }}
      />
      <div className="absolute -top-16 right-[12%] size-56 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-900/20" />
      <div className="absolute top-10 left-[8%] size-40 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}

export function FeaturesPage() {
  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <MarketingPageShell className="relative pb-20">
        <FeaturesPageBackground />

        <MarketingBackLink to="/" className="mb-8">
          <ArrowLeftIcon className="size-4" aria-hidden />
          {FEATURES_PAGE.back}
        </MarketingBackLink>

        <MarketingPageHeader
          eyebrow={FEATURES_PAGE.eyebrow}
          title={FEATURES_PAGE.title}
          subtitle={FEATURES_PAGE.subtitle}
          wide
        />

        <p className={cn("mt-8 max-w-2xl", scene.pageSubtitle)}>
          {FEATURES_PAGE.bridge}
        </p>

        <div className="mt-10">
          <FeaturesAnchorNav links={FEATURES_ANCHOR_LINKS} />
        </div>

        <div className="relative mt-16 space-y-28 lg:mt-20 lg:space-y-36">
          <div
            aria-hidden
            className="pointer-events-none absolute top-[45%] right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          />

          <HomeFeatureChapter
            eyebrow={FEATURES_PAGE.creationEyebrow}
            title={FEATURES_PAGE.creationTitle}
            hint={FEATURES_PAGE.creationSubtitle}
          >
            <div className={cn(scene.surfaceInset, "mt-0")}>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {FEATURES_PAGE.platformsIntro}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {PRODUCTION_FORMS.map((form) => (
                  <span key={form} className={scene.pill}>
                    {form}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-12 space-y-0">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className={scene.sectionHeading}>
                    {FEATURES_PAGE.capabilitiesDetailTitle}
                  </h3>
                  <p className={cn("mt-2 max-w-2xl", scene.sectionHint)}>
                    {FEATURES_PAGE.capabilitiesDetailSubtitle}
                  </p>
                </div>
              </div>

              <div id="capabilities-heading" className="scroll-mt-32 space-y-0">
                {STUDIO_CAPABILITIES.map((capability, index) => (
                  <FeaturesCapabilityDetail
                    key={capability.anchor}
                    capability={capability}
                    step={String(index + 1).padStart(2, "0")}
                    showConnector={index < STUDIO_CAPABILITIES.length - 1}
                  />
                ))}
              </div>
            </div>

            <div className="mt-14">
              <div className="mb-8">
                <h3 className={scene.sectionHeading}>
                  {FEATURES_PAGE.creationLifecycleLabel}
                </h3>
                <p className={cn("mt-2 max-w-2xl", scene.sectionHint)}>
                  {FEATURES_PAGE.creationLifecycleHint}
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:items-stretch">
                {FEATURES_LIFECYCLE_CAPABILITIES.map((capability) => (
                  <FeaturesCapabilityDetail
                    key={capability.anchor}
                    capability={capability}
                    compact
                  />
                ))}
              </div>
            </div>

            <div id="studio-heading" className="mt-14 scroll-mt-32">
              <h3 className={scene.sectionHeading}>
                {FEATURES_PAGE.studioTitle}
              </h3>
              <p className={cn("mt-2 max-w-2xl", scene.sectionHint)}>
                {FEATURES_PAGE.studioSubtitle}
              </p>

              <div className="mt-8">
                <FeaturesStudioFlow panels={STUDIO_PANELS} />
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {EXTRA_CAPABILITIES.map(({ icon: Icon, title, body }) => (
                  <article key={title} className={scene.featureCard}>
                    <div className="flex items-start gap-4">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {title}
                        </h4>
                        <p className={cn("mt-2", scene.body)}>{body}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </HomeFeatureChapter>

          <HomeFeatureChapter
            id="platform-heading"
            eyebrow={FEATURES_PAGE.platformEyebrow}
            title={FEATURES_PAGE.platformTitle}
            hint={FEATURES_PAGE.platformSubtitle}
            className="scroll-mt-32"
          >
            <HomePlatformSpotlight />
          </HomeFeatureChapter>
        </div>

        <MarketingPageFooter className="mt-20">
          <Link to="/studio" className={scene.ctaPrimary}>
            {FEATURES_PAGE.ctaStudio}
          </Link>
          <Link to="/mobile" className={scene.ctaSecondary}>
            {FEATURES_PAGE.ctaMobile}
          </Link>
        </MarketingPageFooter>
      </MarketingPageShell>
    </div>
  );
}
