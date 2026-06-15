import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLinkIcon } from "lucide-react";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/hooks/queries/auth";
import { useSubscriptionQuery } from "@/hooks/queries/subscription";
import { authorDisplayName } from "@/lib/publication-utils";
import { scene } from "@/lib/scene-styles";
import { MEMBERSHIP } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function SettingsUserStrip() {
  const { data: user } = useMeQuery();
  const { data: subscription } = useSubscriptionQuery();

  if (!user) return null;

  const author = {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl ?? null,
  };
  const isPaid =
    subscription?.planId === "pro" ||
    subscription?.planId === "pro_plus" ||
    subscription?.planId === "creator";

  return (
    <section className={cn(scene.surface, "p-5 sm:p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <AuthorAvatar author={author} size="md" className="size-12 text-base" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-foreground">
                {authorDisplayName(author)}
              </p>
              {subscription ? (
                <Badge variant={isPaid ? "default" : "secondary"}>
                  {subscription.planId === "pro_plus"
                    ? MEMBERSHIP.proPlusBadge
                    : subscription.planId === "pro" ||
                        subscription.planId === "creator"
                      ? MEMBERSHIP.proBadge
                      : MEMBERSHIP.freeBadge}
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isPaid ? (
            <Button type="button" size="sm" className="rounded-full" asChild>
              <Link to="/settings/membership">{MEMBERSHIP.upgradeButton}</Link>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" className="rounded-full" asChild>
            <Link to="/profile">
              <ExternalLinkIcon className="size-4" />
              查看我的主页
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function SettingsPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
      <div className="min-w-0">
        <h1 className={scene.sectionHeading}>{title}</h1>
        {description ? (
          <p className={cn("mt-2 max-w-2xl", scene.sectionHint)}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SettingsPanelCard({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className={cn(scene.settingsPanelCard, className)}>
      {title ? (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className={cn("mt-1", scene.sectionHint)}>{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SettingsPageBody({ children }: { children: ReactNode }) {
  return <div className={scene.settingsPanel}>{children}</div>;
}

export function SettingsNotice({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "rounded-xl px-3 py-2 text-sm ring-1",
        tone === "success"
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-red-200",
      )}
    >
      {children}
    </p>
  );
}

export function SettingsEmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card/80 px-6 py-12 text-center ring-1 ring-dashed ring-border">
      <p className={scene.sectionHint}>{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
