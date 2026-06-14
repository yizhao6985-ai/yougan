import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";

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
      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-8 -z-10 h-72 overflow-hidden sm:h-96"
        >
          <div className="absolute -top-16 left-1/2 size-72 -translate-x-1/2 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25" />
          <div className="absolute top-12 right-0 size-56 rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-950/20" />
        </div>

        <p className={scene.eyebrow}>{HOME.eyebrow}</p>
        <h1 className={cn("mt-4 max-w-3xl", scene.titleXl)}>
          {HOME.title}
          <span className="mt-2 block font-sans text-3xl font-semibold text-foreground/90 sm:text-4xl">
            {HOME.titleSuffix}
          </span>
        </h1>
        <p className={cn("mt-6 max-w-2xl", scene.subtitle)}>{HOME.subtitle}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/studio" className={scene.ctaPrimary}>
            {HOME.ctaStudio}
          </Link>
          <Link to="/features" className={scene.ctaSecondary}>
            {HOME.ctaFeatures}
          </Link>
        </div>

        <section className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className={cn(scene.titleLg, "font-serif text-2xl sm:text-3xl")}>
              {HOME.capabilitiesTitle}
            </h2>
            <Link to="/features" className={scene.link}>
              {HOME.capabilitiesLink}
            </Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {HOME_FEATURE_TEASERS.map((item, index) => {
              const Icon = STUDIO_CAPABILITIES[index]?.icon;
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className={cn(scene.cardInteractive, scene.cardPadding, "group")}
                >
                  {Icon ? (
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary transition-colors duration-200 group-hover:bg-primary/15">
                      <Icon className="size-5" aria-hidden />
                    </span>
                  ) : null}
                  <h3 className={cn("mt-4", scene.titleLg)}>{item.title}</h3>
                  <p className={cn("mt-3", scene.body)}>{item.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    了解更多
                    <ArrowRightIcon className="size-3.5" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
