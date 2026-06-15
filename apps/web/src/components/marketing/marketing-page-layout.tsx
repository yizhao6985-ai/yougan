import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function MarketingPageShell({
  children,
  className,
  compact,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <main
      className={cn(
        scene.pageShell,
        compact ? scene.pageMainCompact : scene.pageMain,
        className,
      )}
    >
      {children}
    </main>
  );
}

export function MarketingPageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  wide,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  meta?: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <header className={cn(wide ? scene.pageHeaderWide : scene.pageHeader, className)}>
      {eyebrow ? (
        <p className={scene.pageEyebrow}>{eyebrow}</p>
      ) : null}
      <h1
        className={cn(
          eyebrow ? "mt-3" : undefined,
          typeof title === "string" ? scene.pageTitle : undefined,
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className={cn("mt-3", scene.pageSubtitle)}>{subtitle}</p>
      ) : null}
      {meta ? <div className={cn("mt-4", scene.pageMeta)}>{meta}</div> : null}
    </header>
  );
}

export function MarketingSection({
  title,
  hint,
  action,
  id,
  heading,
  children,
  className,
}: {
  title?: string;
  hint?: ReactNode;
  action?: ReactNode;
  id?: string;
  heading?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn(scene.sectionBlock, className)}>
      {title ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              className={heading ? scene.sectionHeading : scene.sectionTitle}
            >
              {title}
            </h2>
            {hint ? (
              <div className={cn("mt-2", scene.sectionHint)}>{hint}</div>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MarketingBackLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={cn(scene.backLink, className)}>
      {children}
    </Link>
  );
}

export function MarketingPageFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(scene.footerCta, className)}>{children}</div>
  );
}
