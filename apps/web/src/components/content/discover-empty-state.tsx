import { CompassIcon, FilterXIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

type DiscoverEmptyStateProps = {
  filtered: boolean;
  onClearFilters?: () => void;
};

export function DiscoverEmptyState({
  filtered,
  onClearFilters,
}: DiscoverEmptyStateProps) {
  const Icon = filtered ? FilterXIcon : SparklesIcon;

  return (
    <div
      className={cn(
        scene.surface,
        "flex flex-col items-center px-6 py-14 text-center sm:px-10",
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-5 text-base font-medium text-foreground">
        {filtered ? "暂无匹配内容" : "灵感正在路上"}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {filtered
          ? DISCOVER_SECTION.emptyFiltered
          : DISCOVER_SECTION.emptyDefault}
      </p>
      {filtered && onClearFilters ? (
        <Button
          type="button"
          className="mt-6"
          size="sm"
          variant="outline"
          onClick={onClearFilters}
        >
          {DISCOVER_SECTION.clearFilters}
        </Button>
      ) : (
        <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
          <CompassIcon className="size-3.5" aria-hidden />
          创作者发布作品后会出现在这里
        </p>
      )}
    </div>
  );
}
