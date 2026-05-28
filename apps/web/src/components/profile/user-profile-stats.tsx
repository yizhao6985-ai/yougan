import type { UserProfileStats } from "@/services/users";
import { PROFILE_SECTION } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function formatMonth(month: string) {
  const [, m] = month.split("-");
  return `${Number(m)}月`;
}

export function UserProfileStatsPanel({
  stats,
  className,
}: {
  stats: UserProfileStats;
  className?: string;
}) {
  const maxCount = Math.max(
    1,
    ...stats.publicationsByMonth.map((item) => item.count),
  );

  return (
    <section
      className={cn(
        "grid gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm shadow-border/20 sm:grid-cols-3 sm:p-6",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {PROFILE_SECTION.statsPublished}
        </p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {stats.publicationCount}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {PROFILE_SECTION.statsViews}
        </p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {stats.totalViews}
        </p>
        <p className="text-xs text-muted-foreground">
          {PROFILE_SECTION.statsViewsHint}
        </p>
      </div>

      <div className="space-y-2 sm:col-span-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {PROFILE_SECTION.statsTrend}
        </p>
        <div className="flex h-16 items-end gap-1.5">
          {stats.publicationsByMonth.map((item) => (
            <div
              key={item.month}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${formatMonth(item.month)}：${item.count} 篇`}
            >
              <div
                className="w-full rounded-t bg-primary/70 transition-all"
                style={{
                  height: `${Math.max(8, (item.count / maxCount) * 100)}%`,
                  minHeight: item.count > 0 ? "0.5rem" : "0.25rem",
                }}
              />
              <span className="text-[10px] text-muted-foreground">
                {formatMonth(item.month)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
