import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

import {
  DISCOVER_INTENT_ENTRIES,
  type DiscoverFacetOption,
  type DiscoverFacets,
  type DiscoverFilters,
} from "@yougan/domain";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { scene } from "@/lib/scene-styles";
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

function Pill({
  active,
  onClick,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: "md" | "sm";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center rounded-full font-medium whitespace-nowrap transition-colors duration-200",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
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
    <div
      aria-label={ariaLabel}
      role="group"
      className="flex items-center gap-1 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}

export function DiscoverControls({
  filters,
  facets,
  onChange,
}: DiscoverControlsProps) {
  const intent = activeIntent(filters);
  const hasActiveFilters = !isAllActive(filters);

  const groups: FilterGroup[] = [
    { key: "contentFormat", options: facets.contentFormat },
    { key: "topicCategory", options: facets.topicCategory },
    { key: "mediaType", options: facets.mediaType },
  ]
    .filter((group) => group.options.length > 0)
    .filter((group) => !(intent && group.key in intent.filters));

  const visibleGroups = groups.filter((group) => group.options.length > 0);
  const hasFacetFilters = visibleGroups.some(
    (group) => filters[group.key] !== undefined,
  );

  const [refineOpen, setRefineOpen] = useState(hasFacetFilters);

  const updateFilter = (
    key: "contentFormat" | "topicCategory" | "mediaType",
    value?: string,
  ) => {
    const next = { ...filters };
    if (!value) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const showRefine =
    visibleGroups.length > 0 && (refineOpen || hasFacetFilters);

  return (
    <div className={cn(scene.discoverFilterBar, "py-3")}>
      <div className="flex items-center gap-3">
        <ScrollRow aria-label="浏览方向" >
          <Pill active={isAllActive(filters)} onClick={() => onChange({})}>
            全部
          </Pill>
          {DISCOVER_INTENT_ENTRIES.map((entry) => (
            <Pill
              key={entry.id}
              active={isIntentActive(filters, entry.filters)}
              onClick={() =>
                onChange(
                  isIntentActive(filters, entry.filters) ? {} : { ...entry.filters },
                )
              }
            >
              {entry.label}
            </Pill>
          ))}
        </ScrollRow>

        {visibleGroups.length > 0 ? (
          <button
            type="button"
            onClick={() => setRefineOpen((open) => !open)}
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
              refineOpen || hasFacetFilters
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            筛选
            <ChevronDownIcon
              className={cn(
                "size-3.5 transition-transform",
                showRefine && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        ) : null}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => onChange({})}
            className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            清除
          </button>
        ) : null}
      </div>

      {showRefine ? (
        <div
          aria-label="筛选条件"
          role="group"
          className="mt-2 flex flex-wrap items-center gap-1 border-t border-border/50 pt-2"
        >
          {visibleGroups.flatMap((group) =>
            group.options.map((option) => {
              const active = filters[group.key] === option.id;
              return (
                <Pill
                  key={option.id}
                  size="sm"
                  active={active}
                  onClick={() =>
                    updateFilter(group.key, active ? undefined : option.id)
                  }
                >
                  {option.label}
                </Pill>
              );
            }),
          )}
        </div>
      ) : null}
    </div>
  );
}
