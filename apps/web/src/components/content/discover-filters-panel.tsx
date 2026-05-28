import { XIcon } from "lucide-react";

import type {
  DiscoverFacetOption,
  DiscoverFacets,
  DiscoverFilters,
} from "@/lib/discover-taxonomy";
import { cn } from "@/lib/utils";

type FilterGroupProps = {
  label: string;
  activeValue?: string;
  options: DiscoverFacetOption[];
  onSelect: (value: string | undefined) => void;
};

function FilterGroup({
  label,
  activeValue,
  options,
  onSelect,
}: FilterGroupProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="全部"
          active={!activeValue}
          onClick={() => onSelect(undefined)}
        />
        {options.map((option) => (
          <FilterChip
            key={option.id}
            label={option.label}
            count={option.count}
            active={activeValue === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition",
        active
          ? "bg-secondary font-medium text-foreground"
          : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted",
      )}
    >
      {label}
      {typeof count === "number" ? (
        <span className={cn("text-xs", active ? "text-primary" : "text-muted-foreground/70")}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

type DiscoverFiltersPanelProps = {
  filters: DiscoverFilters;
  facets: DiscoverFacets;
  total: number;
  onChange: (filters: DiscoverFilters) => void;
};

export function DiscoverFiltersPanel({
  filters,
  facets,
  total,
  onChange,
}: DiscoverFiltersPanelProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = (key: keyof DiscoverFilters, value?: string) => {
    const next = { ...filters };
    if (!value) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const clearAll = () => onChange({});

  return (
    <section className="space-y-5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-border/25 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">筛选内容</p>
          <p className="text-xs text-muted-foreground">
            共 {total} 条符合条件的内容
          </p>
        </div>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground/90"
          >
            <XIcon className="size-3.5" />
            清除筛选（{activeCount}）
          </button>
        ) : null}
      </div>

      <FilterGroup
        label="平台形态"
        activeValue={filters.platform}
        options={facets.platform}
        onSelect={(value) => updateFilter("platform", value)}
      />
      <FilterGroup
        label="内容体裁"
        activeValue={filters.contentFormat}
        options={facets.contentFormat}
        onSelect={(value) => updateFilter("contentFormat", value)}
      />
      <FilterGroup
        label="主题类别"
        activeValue={filters.topicCategory}
        options={facets.topicCategory}
        onSelect={(value) => updateFilter("topicCategory", value)}
      />
      <FilterGroup
        label="呈现方式"
        activeValue={filters.mediaType}
        options={facets.mediaType}
        onSelect={(value) => updateFilter("mediaType", value)}
      />
    </section>
  );
}
