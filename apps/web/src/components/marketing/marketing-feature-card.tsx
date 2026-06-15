import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function MarketingFeatureCard({
  icon: Icon,
  title,
  body,
  href,
  footer,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  href?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      {Icon ? (
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className={cn("mt-2 flex-1", scene.body)}>{body}</p>
      {footer ? (
        footer
      ) : href ? (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          了解更多
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={cn(scene.featureCardInteractive, "group", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className={cn(scene.featureCard, className)}>{content}</article>
  );
}
