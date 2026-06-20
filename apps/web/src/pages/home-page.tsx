import { Link } from "react-router-dom";

import { HomeAssistantSpotlight } from "@/components/marketing/home-assistant-spotlight";
import { HomeFeatureChapter } from "@/components/marketing/home-feature-chapter";
import { HomePlatformSpotlight } from "@/components/marketing/home-platform-spotlight";
import { HomeStudioPreview } from "@/components/marketing/home-studio-preview";
import { MarketingFeatureCard } from "@/components/marketing/marketing-feature-card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-layout";
import { SiteHeader } from "@/components/site-header";
import {
  HOME_CREATION_LIFECYCLE,
  HOME_CREATION_WORKFLOW,
  PRODUCTION_FORMS,
} from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { HELP_ASSISTANT, HOME } from "@/lib/site-copy";
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
              <span className="mt-3 block bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">
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

            <div className="mt-12">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {HOME.formsLabel}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRODUCTION_FORMS.slice(0, 6).map((form) => (
                  <span key={form} className={scene.pill}>
                    {form}
                  </span>
                ))}
              </div>
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
              eyebrow={HOME.creationEyebrow}
              title={HOME.creationTitle}
              hint={HOME.creationSubtitle}
            >
              <div className={cn(scene.contentGrid2, "lg:grid-cols-4")}>
                {HOME_CREATION_WORKFLOW.map((item) => (
                  <MarketingFeatureCard
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    body={item.body}
                    href={item.href}
                  />
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-accent/20 p-6 ring-1 ring-primary/10 sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {HOME.creationLifecycleLabel}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {HOME.creationLifecycleHint}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:items-stretch">
                  {HOME_CREATION_LIFECYCLE.map((item) => (
                    <MarketingFeatureCard
                      key={item.title}
                      icon={item.icon}
                      title={item.title}
                      body={item.body}
                      href={item.href}
                      className="h-full bg-card"
                    />
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
              eyebrow={HELP_ASSISTANT.eyebrow}
              title={HELP_ASSISTANT.title}
              hint={HELP_ASSISTANT.subtitle}
            >
              <HomeAssistantSpotlight />
            </HomeFeatureChapter>
          </div>

          <div className="mt-20 flex justify-center lg:mt-24">
            <Link to="/features" className={scene.link}>
              {HOME.capabilitiesLink}
            </Link>
          </div>
        </div>
      </MarketingPageShell>
    </div>
  );
}
