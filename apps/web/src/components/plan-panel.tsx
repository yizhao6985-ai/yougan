import {
  CreativeContextEmpty,
  CreativeContextInset,
  CreativeContextList,
  CreativeContextListItem,
  CreativeContextSection,
  CreativeContextSubheading,
  formatContextTime,
} from "@/components/studio/creative-context/shared";
import { PLAN_PANEL } from "@/lib/site-copy";
import type { WorkOutline } from "@/lib/types";

export function PlanPanel({
  outline,
  compact = false,
}: {
  outline?: WorkOutline;
  compact?: boolean;
}) {
  const pending = outline?.pending_changes ?? [];
  const executed = outline?.executed_changes ?? [];

  return (
    <CreativeContextSection
      title={PLAN_PANEL.title}
      hint={PLAN_PANEL.hint}
      compact={compact}
    >
      {outline?.outline_ready && outline.outline_summary ? (
        <CreativeContextInset className="border-emerald-200/80 bg-emerald-50/60 text-foreground/90 dark:border-emerald-800/60 dark:bg-emerald-950/40">
          {outline.outline_summary}
        </CreativeContextInset>
      ) : null}

      <div className="space-y-2">
        <CreativeContextSubheading tone="primary">
          {PLAN_PANEL.pendingLabel}
        </CreativeContextSubheading>
        {pending.length === 0 ? (
          <CreativeContextEmpty>{PLAN_PANEL.pendingEmpty}</CreativeContextEmpty>
        ) : (
          <CreativeContextList>
            {pending.map((change) => (
              <CreativeContextListItem
                key={change.id}
                className="border-primary/15 bg-accent/50"
              >
                {change.description}
              </CreativeContextListItem>
            ))}
          </CreativeContextList>
        )}
      </div>

      <div className="space-y-2">
        <CreativeContextSubheading>{PLAN_PANEL.executedLabel}</CreativeContextSubheading>
        {executed.length === 0 ? (
          <CreativeContextEmpty>{PLAN_PANEL.executedEmpty}</CreativeContextEmpty>
        ) : (
          <CreativeContextList className="max-h-48 overflow-y-auto">
            {[...executed].reverse().map((change) => (
              <CreativeContextListItem
                key={change.id}
                className="text-xs text-muted-foreground"
              >
                <p className="text-sm text-foreground">{change.description}</p>
                <p className="mt-1 text-muted-foreground/70">
                  {formatContextTime(change.executed_at)}
                </p>
              </CreativeContextListItem>
            ))}
          </CreativeContextList>
        )}
      </div>
    </CreativeContextSection>
  );
}
