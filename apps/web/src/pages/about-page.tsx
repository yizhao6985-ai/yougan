import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  HeartHandshakeIcon,
  LayersIcon,
  TargetIcon,
  WorkflowIcon,
} from "lucide-react";

import { MarketingFeatureCard } from "@/components/marketing/marketing-feature-card";
import {
  MarketingBackLink,
  MarketingPageFooter,
  MarketingPageHeader,
  MarketingPageShell,
  MarketingSection,
} from "@/components/marketing/marketing-page-layout";
import { SiteHeader } from "@/components/site-header";
import { scene } from "@/lib/scene-styles";
import { ABOUT_PAGE } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

const VALUE_ICONS = [
  WorkflowIcon,
  HeartHandshakeIcon,
  LayersIcon,
  TargetIcon,
] as const;

export function AboutPage() {
  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <MarketingPageShell>
        <MarketingBackLink to="/" className="mb-8">
          <ArrowLeftIcon className="size-4" aria-hidden />
          {ABOUT_PAGE.back}
        </MarketingBackLink>

        <MarketingPageHeader
          eyebrow={ABOUT_PAGE.eyebrow}
          title={ABOUT_PAGE.title}
          subtitle={ABOUT_PAGE.subtitle}
          wide
        />

        <div className={cn("mt-12", scene.sectionStackLoose)}>
          <section className={cn(scene.surface, "p-8 sm:p-10")}>
            <div className="flex items-start gap-5">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <Building2Icon className="size-6" aria-hidden />
              </span>
              <div>
                <h2 className={scene.sectionHeading}>{ABOUT_PAGE.missionTitle}</h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  {ABOUT_PAGE.missionBody}
                </p>
              </div>
            </div>
          </section>

          <MarketingSection
            id="values-heading"
            title={ABOUT_PAGE.valuesTitle}
            heading
          >
            <div className={scene.contentGrid2}>
              {ABOUT_PAGE.values.map(({ title, body }, index) => {
                const Icon = VALUE_ICONS[index] ?? TargetIcon;
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

          <section className={scene.surfaceInset}>
            <h2 className={scene.sectionHeading}>{ABOUT_PAGE.productTitle}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {ABOUT_PAGE.productBody}
            </p>
            <Link
              to="/features"
              className={cn(
                "mt-6 inline-flex items-center gap-1.5 text-sm font-medium",
                scene.link,
              )}
            >
              {ABOUT_PAGE.productLink}
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </section>

          <MarketingSection
            id="contact-heading"
            title={ABOUT_PAGE.contactTitle}
            hint={ABOUT_PAGE.contactBody}
            heading
          >
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/feedback"
                className={cn(
                  "inline-flex items-center gap-1.5 text-base font-medium",
                  scene.link,
                )}
              >
                提交产品反馈
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
              <a
                href={`mailto:${ABOUT_PAGE.contactEmail}`}
                className={cn("text-sm text-muted-foreground", scene.link)}
              >
                {ABOUT_PAGE.contactEmail}
              </a>
            </div>
          </MarketingSection>
        </div>

        <MarketingPageFooter className="mt-16">
          <Link to="/studio" className={scene.ctaPrimary}>
            {ABOUT_PAGE.ctaStudio}
          </Link>
          <Link to="/features" className={scene.ctaSecondary}>
            {ABOUT_PAGE.ctaFeatures}
          </Link>
        </MarketingPageFooter>
      </MarketingPageShell>
    </div>
  );
}
