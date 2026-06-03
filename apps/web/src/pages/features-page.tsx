import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import {
  CREATION_MODES,
  EXTRA_CAPABILITIES,
  SUPPORTED_PLATFORMS,
  STUDIO_PANELS,
  WORKFLOW_STEPS,
} from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { FEATURES_PAGE } from "@/lib/site-copy";
import { CHAT_MODE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

function ModeSection({
  mode,
  index,
}: {
  mode: (typeof CREATION_MODES)[number];
  index: number;
}) {
  const Icon = mode.icon;
  const reversed = index % 2 === 1;

  return (
    <section
      id={mode.anchor}
      className={cn(scene.card, scene.cardPadding, "scroll-mt-24 sm:p-8")}
    >
      <div
        className={cn(
          "flex flex-col gap-8 lg:flex-row lg:items-start",
          reversed && "lg:flex-row-reverse",
        )}
      >
        <div className="flex shrink-0 flex-col items-start gap-4 lg:w-56">
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-accent text-primary">
            <Icon className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary/90">
              {CHAT_MODE_LABELS[mode.id]}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">
              {mode.tagline}
            </h2>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base leading-7 text-muted-foreground">{mode.summary}</p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {FEATURES_PAGE.modeBenefitsHeading}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {mode.highlights.map((item) => (
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
              <h3 className="text-sm font-medium text-foreground">
                {FEATURES_PAGE.modeLimitsHeading}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {mode.avoids.map((item) => (
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {FEATURES_PAGE.back}
        </Link>

        <p className="mt-8 text-sm uppercase tracking-[0.2em] text-primary/80">
          {FEATURES_PAGE.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {FEATURES_PAGE.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {FEATURES_PAGE.subtitle}
        </p>

        <section className="mt-12 flex flex-wrap gap-2">
          {SUPPORTED_PLATFORMS.map((platform) => (
            <span
              key={platform}
              className="rounded-md border border-border/80 bg-card/90 px-4 py-1.5 text-sm text-foreground/90 shadow-sm"
            >
              {platform}
            </span>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="workflow-heading">
          <h2
            id="workflow-heading"
            className="text-2xl font-semibold text-foreground"
          >
            {FEATURES_PAGE.workflowTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {FEATURES_PAGE.workflowSubtitle}
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {WORKFLOW_STEPS.map((item) => (
              <li
                key={item.step}
                className="relative rounded-lg border border-border/80 bg-card/90 p-6 shadow-sm"
              >
                <span className="font-mono text-xs font-medium text-primary">
                  {item.step}
                </span>
                <h3 className="mt-2 text-lg font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>

          <div
            className="mt-8 hidden items-center justify-center gap-2 text-sm text-muted-foreground/70 sm:flex"
            aria-hidden
          >
            {WORKFLOW_STEPS.map((item, i) => (
              <span key={item.step} className="inline-flex items-center gap-2">
                <span className="rounded-md bg-secondary px-3 py-1 text-muted-foreground">
                  {item.title}
                </span>
                {i < WORKFLOW_STEPS.length - 1 ? (
                  <ArrowRightIcon className="size-4" />
                ) : null}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-20" aria-labelledby="modes-heading">
          <h2
            id="modes-heading"
            className="text-2xl font-semibold text-foreground"
          >
            {FEATURES_PAGE.modesTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {FEATURES_PAGE.modesSubtitle}
          </p>
          <div className="mt-8 space-y-8">
            {CREATION_MODES.map((mode, index) => (
              <ModeSection key={mode.id} mode={mode} index={index} />
            ))}
          </div>
        </section>

        <section className="mt-20" aria-labelledby="studio-heading">
          <h2
            id="studio-heading"
            className="text-2xl font-semibold text-foreground"
          >
            {FEATURES_PAGE.studioTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {FEATURES_PAGE.studioSubtitle}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {STUDIO_PANELS.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-lg border border-border/80 bg-card/90 p-6 shadow-sm"
              >
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-medium text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {EXTRA_CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-lg border border-border/80 bg-card/90 p-6 shadow-sm"
            >
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-medium text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <div className="mt-16 flex flex-wrap justify-center gap-4 border-t border-border/80 pt-12">
          <Link
            to="/studio"
            className={scene.ctaPrimary}
          >
            {FEATURES_PAGE.ctaStudio}
          </Link>
          <Link
            to="/mobile"
            className={scene.ctaSecondary}
          >
            {FEATURES_PAGE.ctaMobile}
          </Link>
        </div>
      </main>
    </div>
  );
}
