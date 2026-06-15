import { Link } from "react-router-dom";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";

import {
  MarketingBackLink,
  MarketingPageFooter,
  MarketingPageHeader,
  MarketingPageShell,
  MarketingSection,
} from "@/components/marketing/marketing-page-layout";
import { SiteHeader } from "@/components/site-header";
import {
  PRODUCTION_FORMS,
  STUDIO_CAPABILITIES,
  EXTRA_CAPABILITIES,
  STUDIO_PANELS,
  WORKFLOW_STEPS,
} from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { FEATURES_PAGE } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function CapabilitySection({
  capability,
  index,
}: {
  capability: (typeof STUDIO_CAPABILITIES)[number];
  index: number;
}) {
  const Icon = capability.icon;
  const reversed = index % 2 === 1;

  return (
    <section
      id={capability.anchor}
      className={cn(scene.surface, "scroll-mt-24 p-6 sm:p-8")}
    >
      <div
        className={cn(
          "flex flex-col gap-8 lg:flex-row lg:items-start",
          reversed && "lg:flex-row-reverse",
        )}
      >
        <div className="flex shrink-0 flex-col items-start gap-4 lg:w-56">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
            <Icon className="size-6" aria-hidden />
          </span>
          <div>
            <p className={scene.pageEyebrow}>{capability.label}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {capability.tagline}
            </h2>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base leading-7 text-muted-foreground">
            {capability.summary}
          </p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {FEATURES_PAGE.capabilityBenefitsHeading}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {capability.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-6 text-muted-foreground"
                  >
                    <CheckIcon
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {FEATURES_PAGE.capabilityLimitsHeading}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {capability.avoids.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-6 text-muted-foreground"
                  >
                    <XIcon
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesPage() {
  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <MarketingPageShell>
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

        <div className={cn("mt-12", scene.sectionStackLoose)}>
          <MarketingSection title={FEATURES_PAGE.platformsIntro}>
            <div className="flex flex-wrap gap-2">
              {PRODUCTION_FORMS.map((form) => (
                <span key={form} className={scene.pill}>
                  {form}
                </span>
              ))}
            </div>
          </MarketingSection>

          <MarketingSection
            id="workflow-heading"
            title={FEATURES_PAGE.workflowTitle}
            hint={FEATURES_PAGE.workflowSubtitle}
            heading
          >
            <ol className={scene.contentGrid2}>
              {WORKFLOW_STEPS.map((item) => (
                <li key={item.step} className={cn(scene.featureCard, "relative")}>
                  <span className="font-mono text-xs font-medium text-primary">
                    {item.step}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className={cn("mt-2", scene.body)}>{item.body}</p>
                </li>
              ))}
            </ol>
          </MarketingSection>

          <MarketingSection
            id="capabilities-heading"
            title={FEATURES_PAGE.capabilitiesDetailTitle}
            hint={FEATURES_PAGE.capabilitiesDetailSubtitle}
            heading
          >
            <div className="space-y-6">
              {STUDIO_CAPABILITIES.map((capability, index) => (
                <CapabilitySection
                  key={capability.anchor}
                  capability={capability}
                  index={index}
                />
              ))}
            </div>
          </MarketingSection>

          <MarketingSection
            id="studio-heading"
            title={FEATURES_PAGE.studioTitle}
            hint={FEATURES_PAGE.studioSubtitle}
            heading
          >
            <div className={scene.contentGrid2}>
              {STUDIO_PANELS.map(({ icon: Icon, title, body }) => (
                <article key={title} className={scene.featureCard}>
                  <Icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                  <p className={cn("mt-2", scene.body)}>{body}</p>
                </article>
              ))}
            </div>
          </MarketingSection>

          <div className={scene.contentGrid2}>
            {EXTRA_CAPABILITIES.map(({ icon: Icon, title, body }) => (
              <article key={title} className={scene.featureCard}>
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                <p className={cn("mt-2", scene.body)}>{body}</p>
              </article>
            ))}
          </div>
        </div>

        <MarketingPageFooter className="mt-16">
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
