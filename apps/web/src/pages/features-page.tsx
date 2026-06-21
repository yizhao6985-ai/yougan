import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { FeaturesAnchorNav } from "@/components/marketing/features-anchor-nav";
import {
  FeaturesCapabilityDetail,
  FeaturesStudioFlow,
} from "@/components/marketing/features-capability-detail";
import { GuideQuickStart } from "@/components/marketing/guide-quick-start";
import { HomeFeatureChapter } from "@/components/marketing/home-feature-chapter";
import {
  MarketingBackLink,
  MarketingPageFooter,
  MarketingPageHeader,
  MarketingPageShell,
} from "@/components/marketing/marketing-page-layout";
import { SiteHeader } from "@/components/site-header";
import {
  EXTRA_CAPABILITIES,
  FEATURES_LIFECYCLE_CAPABILITIES,
  GUIDE_ANCHOR_LINKS,
  STUDIO_CAPABILITIES,
  STUDIO_PANELS,
} from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { GUIDE_PAGE } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function GuidePageBackground() {
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
        <GuidePageBackground />

        <MarketingBackLink to="/" className="mb-8">
          <ArrowLeftIcon className="size-4" aria-hidden />
          {GUIDE_PAGE.back}
        </MarketingBackLink>

        <MarketingPageHeader
          eyebrow={GUIDE_PAGE.eyebrow}
          title={GUIDE_PAGE.title}
          subtitle={GUIDE_PAGE.subtitle}
          wide
        />

        <p className={cn("mt-8 max-w-2xl", scene.pageSubtitle)}>
          {GUIDE_PAGE.bridge}
        </p>

        <p className="mt-4">
          <Link to="/#features-heading" className={scene.link}>
            {GUIDE_PAGE.overviewLink}
          </Link>
        </p>

        <div className="mt-10">
          <FeaturesAnchorNav links={GUIDE_ANCHOR_LINKS} />
        </div>

        <div className="relative mt-16 space-y-28 lg:mt-20 lg:space-y-36">
          <HomeFeatureChapter
            id="quick-start"
            eyebrow={GUIDE_PAGE.quickStartEyebrow}
            title={GUIDE_PAGE.quickStartTitle}
            hint={GUIDE_PAGE.quickStartSubtitle}
            className="scroll-mt-32"
          >
            <GuideQuickStart />
          </HomeFeatureChapter>

          <div id="studio-heading" className="scroll-mt-32">
            <HomeFeatureChapter
              eyebrow={GUIDE_PAGE.studioEyebrow}
              title={GUIDE_PAGE.studioTitle}
              hint={GUIDE_PAGE.studioSubtitle}
            >
              <FeaturesStudioFlow panels={STUDIO_PANELS} />

              <div className="mt-8">
                <h3 className={scene.sectionHeading}>
                  {GUIDE_PAGE.extrasTitle}
                </h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
          </div>

          <HomeFeatureChapter
            eyebrow={GUIDE_PAGE.workflowEyebrow}
            title={GUIDE_PAGE.workflowTitle}
            hint={GUIDE_PAGE.workflowSubtitle}
          >
            <div className="mb-8">
              <h3 className={scene.sectionHeading}>
                {GUIDE_PAGE.capabilitiesDetailTitle}
              </h3>
              <p className={cn("mt-2 max-w-2xl", scene.sectionHint)}>
                {GUIDE_PAGE.capabilitiesDetailSubtitle}
              </p>
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

            <div className="mt-14">
              <div className="mb-8">
                <h3 className={scene.sectionHeading}>
                  {GUIDE_PAGE.creationLifecycleLabel}
                </h3>
                <p className={cn("mt-2 max-w-2xl", scene.sectionHint)}>
                  {GUIDE_PAGE.creationLifecycleHint}
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
          </HomeFeatureChapter>

          <HomeFeatureChapter
            id="publish-heading"
            eyebrow={GUIDE_PAGE.publishEyebrow}
            title={GUIDE_PAGE.publishTitle}
            hint={GUIDE_PAGE.publishSubtitle}
            className="scroll-mt-32"
          >
            <div className="grid gap-6 sm:grid-cols-3">
              {GUIDE_PAGE.publishSteps.map((step) => (
                <article key={step.title} className={scene.featureCard}>
                  <h3 className="text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className={cn("mt-2", scene.body)}>{step.body}</p>
                </article>
              ))}
            </div>
          </HomeFeatureChapter>
        </div>

        <MarketingPageFooter className="mt-20">
          <Link to="/studio" className={scene.ctaPrimary}>
            {GUIDE_PAGE.ctaStudio}
          </Link>
          <Link to="/mobile" className={scene.ctaSecondary}>
            {GUIDE_PAGE.ctaMobile}
          </Link>
        </MarketingPageFooter>
      </MarketingPageShell>
    </div>
  );
}
