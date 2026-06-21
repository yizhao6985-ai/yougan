import { CheckIcon, XIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { StudioCapability } from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { GUIDE_PAGE } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function FeaturesCapabilityDetail({
  capability,
  step,
  showConnector = false,
  compact = false,
}: {
  capability: StudioCapability;
  step?: string;
  showConnector?: boolean;
  compact?: boolean;
}) {
  const Icon = capability.icon;

  return (
    <article
      id={capability.anchor}
      className={cn(
        "relative scroll-mt-32",
        compact && "h-full",
        showConnector && "pb-10",
      )}
    >
      {showConnector ? (
        <div
          aria-hidden
          className="absolute top-14 bottom-0 left-5 hidden w-px bg-border/80 sm:block"
        />
      ) : null}

      <div
        className={cn(
          compact ? scene.featureCard : scene.surface,
          "relative p-6 sm:p-8",
          compact && "flex h-full flex-col",
        )}
      >
        <div
          className={cn(
            compact
              ? "flex flex-1 flex-col"
              : "flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8",
          )}
        >
          <div
            className={cn(
              compact
                ? "shrink-0"
                : "flex shrink-0 items-start gap-4 sm:w-52 sm:flex-col sm:gap-3",
            )}
          >
            {!compact ? (
              <div className="flex items-center gap-3">
                {step ? (
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-primary ring-1 ring-primary/15">
                    {step}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary",
                    step && "hidden sm:inline-flex",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
              </div>
            ) : (
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
            )}

            <div className={cn("min-w-0", compact ? "mt-4" : undefined)}>
              <p className={scene.pageEyebrow}>{capability.label}</p>
              <h3
                className={cn(
                  "mt-1.5 font-semibold tracking-tight text-foreground",
                  compact ? "text-xl" : "text-2xl",
                )}
              >
                {capability.tagline}
              </h3>
            </div>
          </div>

          <div className={cn("min-w-0", compact ? "mt-5 flex flex-1 flex-col" : "flex-1")}>
            <p
              className={cn(
                "leading-7 text-muted-foreground",
                compact ? "text-sm" : "text-base",
              )}
            >
              {capability.summary}
            </p>

            <div
              className={cn(
                "grid gap-4",
                compact ? "mt-6 flex-1 items-stretch sm:grid-cols-2" : "mt-6 gap-6",
                !compact &&
                  (capability.avoids.length > 0
                    ? "lg:grid-cols-2"
                    : "max-w-xl"),
              )}
            >
              <div className="flex h-full flex-col rounded-xl bg-accent/25 p-4 ring-1 ring-primary/10">
                <h4 className="text-sm font-semibold text-foreground">
                  {GUIDE_PAGE.capabilityBenefitsHeading}
                </h4>
                <ul className="mt-3 space-y-2">
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

              {capability.avoids.length > 0 ? (
                <div className="flex h-full flex-col rounded-xl bg-secondary/40 p-4 ring-1 ring-border/50">
                  <h4 className="text-sm font-semibold text-foreground">
                    {GUIDE_PAGE.capabilityLimitsHeading}
                  </h4>
                  <ul className="mt-3 space-y-2">
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeaturesStudioFlow({
  panels,
}: {
  panels: readonly {
    icon: LucideIcon;
    title: string;
    body: string;
  }[];
}) {
  return (
    <div className={cn(scene.surface, "overflow-x-auto p-4 sm:p-6")}>
      <ol className="flex min-w-max items-stretch gap-3 lg:min-w-0 lg:gap-4">
        {panels.map((panel, index) => {
          const Icon = panel.icon;
          const isLast = index === panels.length - 1;

          return (
            <li key={panel.title} className="flex items-stretch gap-3 lg:gap-4">
              <article className="flex w-44 flex-col rounded-xl bg-accent/20 p-4 ring-1 ring-primary/10 sm:w-48 lg:w-auto lg:min-w-0 lg:flex-1">
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {panel.title}
                </h3>
                <p className={cn("mt-2 flex-1", scene.body)}>{panel.body}</p>
              </article>
              {!isLast ? (
                <span
                  aria-hidden
                  className="hidden self-center text-muted-foreground/50 lg:inline"
                >
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
