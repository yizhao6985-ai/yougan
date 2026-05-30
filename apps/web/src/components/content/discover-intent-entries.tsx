import { cn } from "@/lib/utils";
import {
  DISCOVER_INTENT_ENTRIES,
  type DiscoverFilters,
} from "@/lib/discover-taxonomy";
import { DISCOVER_SECTION } from "@/lib/site-copy";

type DiscoverIntentEntriesProps = {
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
};

function isIntentActive(
  filters: DiscoverFilters,
  intentFilters: DiscoverFilters,
) {
  return Object.entries(intentFilters).every(
    ([key, value]) => filters[key as keyof DiscoverFilters] === value,
  );
}

export function DiscoverIntentEntries({
  filters,
  onChange,
}: DiscoverIntentEntriesProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          {DISCOVER_SECTION.intentHeading}
        </p>
        <p className="text-xs text-muted-foreground">
          {DISCOVER_SECTION.intentDescription}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {DISCOVER_INTENT_ENTRIES.map((entry) => {
          const active = isIntentActive(filters, entry.filters);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() =>
                onChange(active ? {} : { ...entry.filters })
              }
              className={cn(
                "rounded-lg border px-3 py-3 text-left transition",
                active
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border/80 bg-card hover:border-border hover:bg-muted/50",
              )}
            >
              <p className="text-sm font-medium text-foreground">
                {entry.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {entry.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
