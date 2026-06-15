import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  DiscoverFacetOption,
  DiscoverFacets,
  DiscoverFilters,
} from "@/lib/discover-taxonomy";
import { cn } from "@/lib/utils";

type DiscoverFilterDialogProps = {
  filters: DiscoverFilters;
  facets: DiscoverFacets;
  onChange: (filters: DiscoverFilters) => void;
};

function FilterGroup({
  label,
  activeValue,
  options,
  onSelect,
}: {
  label: string;
  activeValue?: string;
  options: DiscoverFacetOption[];
  onSelect: (value: string | undefined) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        <FilterOption
          label="全部"
          active={!activeValue}
          onClick={() => onSelect(undefined)}
        />
        {options.map((option) => (
          <FilterOption
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

function FilterOption({
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
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors duration-200",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
      )}
    >
      {label}
      {typeof count === "number" ? (
        <span
          className={cn(
            "text-xs tabular-nums",
            active ? "text-primary-foreground/85" : "text-muted-foreground/70",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function DiscoverFilterDialog({
  filters,
  facets,
  onChange,
}: DiscoverFilterDialogProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = (key: keyof DiscoverFilters, value?: string) => {
    const next = { ...filters };
    if (!value) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-full"
        >
          <SlidersHorizontalIcon className="size-4" aria-hidden />
          筛选
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>筛选内容</DialogTitle>
          <DialogDescription>
            按平台、体裁、主题与媒介组合筛选公开作品。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
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
            label="媒介形态"
            activeValue={filters.mediaType}
            options={facets.mediaType}
            onSelect={(value) => updateFilter("mediaType", value)}
          />
        </div>
        {activeCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => onChange({})}
          >
            清除全部筛选
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
