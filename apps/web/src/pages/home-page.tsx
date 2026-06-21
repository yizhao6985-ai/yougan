import { Link } from "react-router-dom";

import { HomeAssistantSpotlight } from "@/components/marketing/home-assistant-spotlight";
import { HomeCreationShowcase } from "@/components/marketing/home-creation-showcase";
import { HomeFeatureChapter } from "@/components/marketing/home-feature-chapter";
import { HomePlatformSpotlight } from "@/components/marketing/home-platform-spotlight";
import { HomeStudioPreview } from "@/components/marketing/home-studio-preview";
import { FeaturesStudioFlow } from "@/components/marketing/features-capability-detail";
import { MarketingFeatureCard } from "@/components/marketing/marketing-feature-card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-layout";
import { SiteHeader } from "@/components/site-header";
import {
  EXTRA_CAPABILITIES,
  HOME_CORE_FEATURES,
  STUDIO_PANELS,
} from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { HOME } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function HomeHeroBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "3.5rem 3.5rem",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      />
      <div className="absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25" />
      <div className="absolute top-16 right-[8%] size-64 rounded-full bg-amber-100/45 blur-3xl dark:bg-amber-950/20" />
      <div className="absolute top-40 left-[6%] size-48 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}

export function HomePage() {
  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <MarketingPageShell className="relative pb-20">
        <HomeHeroBackground />

        <section className="grid items-center gap-12 pt-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pt-10 xl:gap-20">
          <header className={scene.pageHeaderWide}>
            <p className={scene.pageEyebrow}>{HOME.eyebrow}</p>
            <h1 className={cn("mt-4 max-w-4xl", scene.pageTitleHero)}>
              {HOME.title}
            </h1>
            <p className="mt-3 text-xl font-medium tracking-tight text-muted-foreground sm:text-2xl">
              {HOME.tagline}
            </p>
            <p className={cn("mt-6 max-w-2xl", scene.pageSubtitle)}>
              {HOME.subtitle}
            </p>
            <p
              className={cn(
                "mt-5 max-w-2xl bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text",
                "text-lg font-semibold tracking-tight text-transparent sm:text-xl",
              )}
            >
              {HOME.mediaSpectrum}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/studio" className={scene.ctaPrimary}>
                {HOME.ctaStudio}
              </Link>
              <Link to="/features" className={scene.ctaSecondary}>
                {HOME.ctaGuide}
              </Link>
            </div>
          </header>

          <HomeStudioPreview />
        </section>

        <div className="mt-24 lg:mt-32">
          <p
            className={cn(
              "mx-auto max-w-2xl text-center text-base leading-7 text-muted-foreground sm:text-lg",
            )}
          >
            {HOME.featuresBridge}
          </p>

          <div className="relative mt-20 space-y-24 lg:mt-24 lg:space-y-32">
            <div
              aria-hidden
              className="pointer-events-none absolute top-[55%] right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
            />

            <HomeFeatureChapter
              eyebrow={HOME.formsEyebrow}
              title={HOME.formsTitle}
              hint={HOME.formsSubtitle}
            >
              <HomeCreationShowcase />
            </HomeFeatureChapter>

            <HomeFeatureChapter
              id="features-heading"
              eyebrow={HOME.featuresEyebrow}
              title={HOME.featuresTitle}
              hint={HOME.featuresSubtitle}
              className="scroll-mt-32"
            >
              <div className={cn(scene.contentGrid2, "lg:grid-cols-3")}>
                {HOME_CORE_FEATURES.map((item) => (
                  <MarketingFeatureCard
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    body={item.body}
                    href={item.href}
                  />
                ))}
              </div>
            </HomeFeatureChapter>

            <HomeFeatureChapter
              eyebrow={HOME.studioEyebrow}
              title={HOME.studioTitle}
              hint={HOME.studioSubtitle}
            >
              <FeaturesStudioFlow panels={STUDIO_PANELS} />

              <div className="mt-8">
                <h3 className={scene.sectionHeading}>{HOME.extrasTitle}</h3>
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

            <HomeFeatureChapter
              eyebrow={HOME.platformEyebrow}
              title={HOME.platformTitle}
              hint={HOME.platformSubtitle}
            >
              <HomePlatformSpotlight />
            </HomeFeatureChapter>

            <HomeFeatureChapter
              eyebrow={HOME.assistantEyebrow}
              title={HOME.assistantTitle}
              hint={HOME.assistantSubtitle}
            >
              <HomeAssistantSpotlight />
            </HomeFeatureChapter>
          </div>

          <div className="mt-20 flex justify-center lg:mt-24">
            <Link to="/features" className={scene.link}>
              {HOME.guideLink}
            </Link>
          </div>
        </div>
      </MarketingPageShell>
    </div>
  );
}
