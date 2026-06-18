import type { ReactNode } from "react";

import {
  DISCOVER_INTENT_ENTRIES,
  type DiscoverFacetOption,
  type DiscoverFacets,
  type DiscoverFilters,
} from "@/lib/discover-taxonomy";
import { cn } from "@/lib/utils";

type DiscoverControlsProps = {
  filters: DiscoverFilters;
  facets: DiscoverFacets;
  onChange: (filters: DiscoverFilters) => void;
};

type FilterGroup = {
  key: keyof DiscoverFilters;
  options: DiscoverFacetOption[];
};

function isIntentActive(
  filters: DiscoverFilters,
  intentFilters: DiscoverFilters,
) {
  return Object.entries(intentFilters).every(([key, value]) => {
    const current = filters[key as keyof DiscoverFilters];
    return current === value;
  });
}

function isAllActive(filters: DiscoverFilters) {
  return Object.values(filters).every((value) => !value);
}

function activeIntent(filters: DiscoverFilters) {
  return DISCOVER_INTENT_ENTRIES.find((entry) =>
    isIntentActive(filters, entry.filters),
  );
}

function DiscoverPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ScrollRow({
  "aria-label": ariaLabel,
  children,
}: {
  "aria-label": string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div
        aria-label={ariaLabel}
        role="group"
        className="flex items-center gap-1.5 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

function GroupDivider() {
  return (
    <div
      aria-hidden
      className="mx-0.5 h-4 w-px shrink-0 self-center bg-border/80"
    />
  );
}

export function DiscoverControls({
  filters,
  facets,
  onChange,
}: DiscoverControlsProps) {
  const intent = activeIntent(filters);
  const hasActiveFilters = !isAllActive(filters);

  const updateFilter = (
    key: "contentFormat" | "topicCategory" | "mediaType",
    value?: string,
  ) => {
    const next = { ...filters };
    if (!value) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const groups: FilterGroup[] = [
    { key: "contentFormat", options: facets.contentFormat },
    { key: "topicCategory", options: facets.topicCategory },
    { key: "mediaType", options: facets.mediaType },
  ]
    .filter((group) => group.options.length > 0)
    .filter((group) => !(intent && group.key in intent.filters));

  const visibleGroups = groups.filter((group) => group.options.length > 0);

  const hasExtraFilters =
    hasActiveFilters &&
    (!intent ||
      Object.entries(filters).some(
        ([key, value]) => value && !(key in intent.filters),
      ));

  const showRefineRow = visibleGroups.length > 0 || hasExtraFilters;

  return (
    <div className="mt-8 space-y-3">
      <ScrollRow aria-label="浏览方向">
        <DiscoverPill active={isAllActive(filters)} onClick={() => onChange({})}>
          全部
        </DiscoverPill>
        {DISCOVER_INTENT_ENTRIES.map((entry) => (
          <DiscoverPill
            key={entry.id}
            active={isIntentActive(filters, entry.filters)}
            onClick={() =>
              onChange(
                isIntentActive(filters, entry.filters) ? {} : { ...entry.filters },
              )
            }
          >
            {entry.label}
          </DiscoverPill>
        ))}
      </ScrollRow>

      {showRefineRow ? (
        <ScrollRow aria-label="筛选条件">
          {visibleGroups.map((group, groupIndex) => (
            <div key={group.key} className="contents">
              {groupIndex > 0 ? <GroupDivider /> : null}
              {group.options.map((option) => {
                const active = filters[group.key] === option.id;
                return (
                  <DiscoverPill
                    key={option.id}
                    active={active}
                    onClick={() =>
                      updateFilter(group.key, active ? undefined : option.id)
                    }
                  >
                    {option.label}
                  </DiscoverPill>
                );
              })}
            </div>
          ))}

          {hasExtraFilters ? (
            <>
              {visibleGroups.length > 0 ? <GroupDivider /> : null}
              <button
                type="button"
                onClick={() => onChange(intent ? { ...intent.filters } : {})}
                className="shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                重置
              </button>
            </>
          ) : null}
        </ScrollRow>
      ) : null}
    </div>
  );
}
