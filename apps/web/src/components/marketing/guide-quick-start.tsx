import { GUIDE_QUICK_START_STEPS } from "@/lib/product-capabilities";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function GuideQuickStart() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {GUIDE_QUICK_START_STEPS.map((step, index) => {
        const Icon = step.icon;

        return (
          <li key={step.title} className={cn(scene.featureCard, "h-full")}>
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className={cn("mt-2 flex-1", scene.body)}>{step.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
