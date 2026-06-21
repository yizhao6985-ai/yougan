import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  resolveOnboardingTarget,
  type StudioOnboardingStep,
} from "@/lib/studio-onboarding";
import { computeOnboardingCardPlacement, clampSpotlightRect } from "@/lib/studio-onboarding-placement";
import { STUDIO_ONBOARDING } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const SPOTLIGHT_PADDING = 10;

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

function measureTarget(step: Extract<StudioOnboardingStep, { kind: "spotlight" }>) {
  const element = resolveOnboardingTarget(step.target, step.fallbackTarget);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  return clampSpotlightRect({
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  });
}

function spotlightShadow() {
  return [
    "0 0 0 1px color-mix(in oklab, var(--primary) 28%, transparent)",
    "0 0 0 5px color-mix(in oklab, var(--primary) 10%, transparent)",
    "0 12px 40px color-mix(in oklab, var(--primary) 14%, transparent)",
    "0 0 0 9999px color-mix(in oklab, var(--background) 18%, rgb(0 0 0 / 0.52))",
  ].join(", ");
}

function OnboardingProgress({
  stepIndex,
  stepCount,
}: {
  stepIndex: number;
  stepCount: number;
}) {
  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={STUDIO_ONBOARDING.progress(stepIndex + 1, stepCount)}
    >
      {Array.from({ length: stepCount }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "h-1.5 rounded-full transition-all duration-300 ease-out",
            index === stepIndex
              ? "w-5 bg-primary"
              : index < stepIndex
                ? "w-1.5 bg-primary/45"
                : "w-1.5 bg-border/90",
          )}
        />
      ))}
    </div>
  );
}

function StepBulletList({
  items,
  variant = "numbered",
}: {
  items: readonly string[];
  variant?: "numbered" | "compact";
}) {
  if (variant === "compact") {
    return (
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const splitIndex = item.indexOf("：");
          const title = splitIndex >= 0 ? item.slice(0, splitIndex) : item;
          const body = splitIndex >= 0 ? item.slice(splitIndex + 1) : "";

          return (
            <li
              key={item}
              className="rounded-lg bg-accent/25 px-3 py-2 ring-1 ring-primary/8"
            >
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">{title}</span>
                {body ? `：${body}` : null}
              </p>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ol className="mt-4 space-y-2.5">
      {items.map((item, index) => {
        const splitIndex = item.indexOf("：");
        const title = splitIndex >= 0 ? item.slice(0, splitIndex) : item;
        const body = splitIndex >= 0 ? item.slice(splitIndex + 1) : "";

        return (
          <li
            key={item}
            className="flex gap-3 rounded-xl bg-accent/35 px-3 py-2.5 ring-1 ring-primary/10"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold tabular-nums text-primary">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {body ? (
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StudioOnboardingStepCard({
  step,
  stepIndex,
  stepCount,
  onNext,
  onDismiss,
  className,
  cardRef,
}: {
  step: StudioOnboardingStep;
  stepIndex: number;
  stepCount: number;
  onNext: () => void;
  onDismiss: () => void;
  className?: string;
  cardRef?: RefObject<HTMLDivElement | null>;
}) {
  const isLast = stepIndex >= stepCount - 1;
  const isWelcome = step.id === "welcome";

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-onboarding-title"
      aria-describedby="studio-onboarding-body"
      className={cn(
        "relative w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6",
        "ring-1 ring-white/10 dark:ring-white/5",
        className,
      )}
    >
      {isWelcome ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-primary/10 blur-3xl"
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <OnboardingProgress stepIndex={stepIndex} stepCount={stepCount} />
        <button
          type="button"
          className="-mr-1 rounded-lg p-1.5 text-muted-foreground/80 transition hover:bg-muted/70 hover:text-foreground"
          aria-label={STUDIO_ONBOARDING.close}
          onClick={onDismiss}
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <h2
        id="studio-onboarding-title"
        className="relative mt-4 text-xl font-semibold tracking-tight text-foreground"
      >
        {step.title}
      </h2>
      <p
        id="studio-onboarding-body"
        className="relative mt-2 text-sm leading-7 text-muted-foreground"
      >
        {step.body}
      </p>

      {step.bullets?.length ? (
        <StepBulletList
          items={step.bullets}
          variant={step.id === "creative-panel" ? "compact" : "numbered"}
        />
      ) : null}

      {step.kind === "spotlight" && step.footnote ? (
        <p className="relative mt-3 rounded-lg bg-primary/8 px-3 py-2.5 text-xs leading-5 text-primary">
          {step.footnote}
        </p>
      ) : null}

      {step.id === "finish" ? (
        <div className="relative mt-4 space-y-2 rounded-xl bg-secondary/35 px-3.5 py-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/60">
          <p>
            <Link
              to="/features#quick-start"
              className="font-medium text-primary underline-offset-4 transition hover:underline"
              onClick={onNext}
            >
              {STUDIO_ONBOARDING.finishGuideLink}
            </Link>
          </p>
          <p>{STUDIO_ONBOARDING.finishAssistantHint}</p>
        </div>
      ) : null}

      <div className="relative mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <button
          type="button"
          className="text-sm text-muted-foreground transition hover:text-foreground"
          onClick={onDismiss}
        >
          {STUDIO_ONBOARDING.skip}
        </button>
        <Button type="button" size="sm" className="min-w-[5.5rem]" onClick={onNext}>
          {isLast ? STUDIO_ONBOARDING.finish : STUDIO_ONBOARDING.next}
        </Button>
      </div>
    </div>
  );
}

export function StudioOnboardingOverlay({
  step,
  stepIndex,
  stepCount,
  onNext,
  onDismiss,
}: {
  step: StudioOnboardingStep;
  stepIndex: number;
  stepCount: number;
  onNext: () => void;
  onDismiss: () => void;
}) {
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPlacement, setCardPlacement] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (step.kind !== "spotlight") {
      setSpotlight(null);
      return;
    }

    let raf = 0;
    let attempts = 0;

    const update = () => {
      const next = measureTarget(step);
      setSpotlight(next);
      if (!next && attempts < 8) {
        attempts += 1;
        raf = window.requestAnimationFrame(update);
      }
    };

    update();
    const retryTimer = window.setTimeout(update, 320);

    const onResize = () => update();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(retryTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
    };
  }, [step]);

  useLayoutEffect(() => {
    if (step.kind !== "spotlight") {
      setCardPlacement(null);
      return;
    }

    const updatePlacement = () => {
      if (!spotlight || !cardRef.current) {
        setCardPlacement(null);
        return;
      }

      const { offsetWidth, offsetHeight } = cardRef.current;
      if (offsetWidth <= 0 || offsetHeight <= 0) return;

      setCardPlacement(
        computeOnboardingCardPlacement(
          spotlight,
          offsetWidth,
          offsetHeight,
          step,
        ),
      );
    };

    updatePlacement();

    const cardElement = cardRef.current;
    if (!cardElement) return;

    const resizeObserver = new ResizeObserver(updatePlacement);
    resizeObserver.observe(cardElement);

    return () => resizeObserver.disconnect();
  }, [spotlight, step]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  const cardProps = {
    step,
    stepIndex,
    stepCount,
    onNext,
    onDismiss,
    cardRef,
  };

  const spotlightCardStyle =
    cardPlacement == null
      ? {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          visibility: "hidden" as const,
        }
      : {
          top: `${cardPlacement.top}px`,
          left: `${cardPlacement.left}px`,
          visibility: "visible" as const,
        };

  if (step.kind === "center") {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-background/50 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: MOTION_EASE }}
        />
        <motion.div
          key={step.id}
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={{ duration: 0.28, ease: MOTION_EASE }}
        >
          <StudioOnboardingStepCard {...cardProps} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120]">
      {spotlight ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl transition-[top,left,width,height] duration-300 ease-out will-change-[top,left,width,height]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: spotlightShadow(),
          }}
        />
      ) : (
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-background/50 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: MOTION_EASE }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="absolute z-10 w-[min(100vw-2rem,22.5rem)] transition-[top,left] duration-300 ease-out"
          style={spotlightCardStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: cardPlacement ? 1 : 0, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.24, ease: MOTION_EASE }}
        >
          <StudioOnboardingStepCard {...cardProps} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
