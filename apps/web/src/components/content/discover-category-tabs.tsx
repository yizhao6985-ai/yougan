import {
  DISCOVER_INTENT_ENTRIES,
  type DiscoverFilters,
} from "@/lib/discover-taxonomy";
import { cn } from "@/lib/utils";

type DiscoverCategoryTabsProps = {
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

function isAllActive(filters: DiscoverFilters) {
  return Object.values(filters).every((value) => !value);
}

export function DiscoverCategoryTabs({
  filters,
  onChange,
}: DiscoverCategoryTabsProps) {
  const allActive = isAllActive(filters);

  return (
    <nav
      aria-label="内容分类"
      className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={() => onChange({})}
        className={cn(
          "shrink-0 cursor-pointer border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200 sm:px-4",
          allActive
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        全部
      </button>
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
              "shrink-0 cursor-pointer border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200 sm:px-4",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label}
          </button>
        );
      })}
    </nav>
  );
}
