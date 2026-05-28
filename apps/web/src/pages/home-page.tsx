import { Link } from "react-router-dom";

import { SiteHeader } from "@/components/site-header";
import { HOME_FEATURE_TEASERS } from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { HOME } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function HomePage() {
  return (
    <div className={scene.marketing}>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <p className={scene.eyebrow}>{HOME.eyebrow}</p>
        <h1 className={cn("mt-4 max-w-3xl", scene.titleXl)}>
          {HOME.title}
          <span className="mt-2 block text-3xl font-semibold text-foreground/90 sm:text-4xl">
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
            <h2 className={scene.titleLg}>{HOME.capabilitiesTitle}</h2>
            <Link to="/features" className={scene.link}>
              {HOME.capabilitiesLink}
            </Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {HOME_FEATURE_TEASERS.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className={cn(scene.cardInteractive, scene.cardPadding)}
              >
                <h3 className={scene.titleLg}>{item.title}</h3>
                <p className={cn("mt-3", scene.body)}>{item.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
