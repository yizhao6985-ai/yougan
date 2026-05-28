import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { scene } from "@/lib/scene-styles";

export const creativeContextPanelClassNames = {
  asideHeader: scene.studioPanelHeader,
  asideTitle: scene.studioPanelHeaderTitle,
  asideHint: scene.studioPanelHeaderHint,
  scrollArea:
    "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5 [scrollbar-gutter:stable]",
  sections: "space-y-7 pb-1",
} as const;

export function formatContextTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CreativeContextSection({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3.5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {hint ? (
            <p className="mt-1.5 text-pretty text-xs leading-5 text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
      <div className="space-y-3 break-words">{children}</div>
    </section>
  );
}

export function CreativeContextSubheading({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "primary" | "muted";
}) {
  return (
    <h4
      className={cn(
        "text-xs font-medium uppercase tracking-wide",
        tone === "primary" ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
    </h4>
  );
}

export function CreativeContextEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[4.5rem] rounded-xl border border-dashed border-border bg-muted/50 px-4 py-4 text-pretty text-xs leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

export function CreativeContextInset({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/60 px-4 py-2.5 text-sm leading-6 text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CreativeContextList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cn("space-y-2", className)}>{children}</ul>;
}

export function CreativeContextListItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-2.5 text-sm leading-6 text-foreground break-words",
        className,
      )}
    >
      {children}
    </li>
  );
}
