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

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {ABOUT_PAGE.back}
        </Link>

        <p className="mt-8 text-sm uppercase tracking-[0.2em] text-primary/80">
          {ABOUT_PAGE.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {ABOUT_PAGE.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {ABOUT_PAGE.subtitle}
        </p>

        <section className="mt-14 rounded-lg border border-border/80 bg-card/90 p-8 shadow-sm shadow-border/20 sm:p-10">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <Building2Icon className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {ABOUT_PAGE.missionTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {ABOUT_PAGE.missionBody}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="values-heading">
          <h2
            id="values-heading"
            className="text-2xl font-semibold text-foreground"
          >
            {ABOUT_PAGE.valuesTitle}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {ABOUT_PAGE.values.map(({ title, body }, index) => {
              const Icon = VALUE_ICONS[index] ?? TargetIcon;
              return (
                <article
                  key={title}
                  className="rounded-lg border border-border/80 bg-card/90 p-6 shadow-sm shadow-border/20"
                >
                  <Icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-3 font-medium text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-16 rounded-lg border border-primary/15 bg-accent/40 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-foreground">
            {ABOUT_PAGE.productTitle}
          </h2>
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

        <section className="mt-16" aria-labelledby="contact-heading">
          <h2
            id="contact-heading"
            className="text-2xl font-semibold text-foreground"
          >
            {ABOUT_PAGE.contactTitle}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {ABOUT_PAGE.contactBody}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              to="/feedback"
              className={cn("inline-flex items-center gap-1.5 text-base font-medium", scene.link)}
            >
              提交产品反馈
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
            <a
              href={`mailto:${ABOUT_PAGE.contactEmail}`}
              className={cn("text-sm text-muted-foreground transition hover:text-primary", scene.link)}
            >
              {ABOUT_PAGE.contactEmail}
            </a>
          </div>
        </section>

        <div className="mt-16 flex flex-wrap justify-center gap-4 border-t border-border/80 pt-12">
          <Link to="/studio" className={scene.ctaPrimary}>
            {ABOUT_PAGE.ctaStudio}
          </Link>
          <Link to="/features" className={scene.ctaSecondary}>
            {ABOUT_PAGE.ctaFeatures}
          </Link>
        </div>
      </main>
    </div>
  );
}
