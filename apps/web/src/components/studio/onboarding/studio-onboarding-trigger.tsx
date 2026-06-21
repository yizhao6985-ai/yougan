import { CompassIcon } from "lucide-react";

import { useStudioOnboardingOptional } from "@/components/studio/onboarding/studio-onboarding-provider";
import { STUDIO_ONBOARDING } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function StudioOnboardingTrigger({
  className,
}: {
  className?: string;
}) {
  const onboarding = useStudioOnboardingOptional();
  if (!onboarding) return null;

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition duration-200",
        "hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        className,
      )}
      aria-label={STUDIO_ONBOARDING.triggerLabel}
      onClick={() => onboarding.startTour()}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/70 text-primary ring-1 ring-primary/10 transition duration-200 group-hover:bg-accent group-hover:ring-primary/20">
        <CompassIcon className="size-4" aria-hidden />
      </span>
      <span className="text-sm font-medium text-foreground/85 transition group-hover:text-foreground">
        {STUDIO_ONBOARDING.triggerLabel}
      </span>
    </button>
  );
}
