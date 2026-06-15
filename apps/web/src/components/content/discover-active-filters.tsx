import { XIcon } from "lucide-react";

import type { DiscoverFilters } from "@/lib/discover-taxonomy";
import {
  CONTENT_FORMATS,
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  MEDIA_MODALITIES,
} from "@/lib/discover-taxonomy";

type DiscoverActiveFiltersProps = {
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
};

function labelFor(key: keyof DiscoverFilters, value: string) {
  switch (key) {
    case "platform":
      return DISCOVER_PLATFORMS.find((item) => item.id === value)?.label;
    case "contentFormat":
      return CONTENT_FORMATS.find((item) => item.id === value)?.label;
    case "topicCategory":
      return DISCOVER_TOPIC_CATEGORIES.find((item) => item.id === value)?.label;
    case "mediaType":
      return MEDIA_MODALITIES.find((item) => item.id === value)?.label;
    default:
      return value;
  }
}

export function DiscoverActiveFilters({
  filters,
  onChange,
}: DiscoverActiveFiltersProps) {
  const entries = Object.entries(filters).filter(
    (entry): entry is [keyof DiscoverFilters, string] => Boolean(entry[1]),
  );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(([key, value]) => {
        const label = labelFor(key, value);
        if (!label) return null;

        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              const next = { ...filters };
              delete next[key];
              onChange(next);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-accent/70 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            {label}
            <XIcon className="size-3" aria-hidden />
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange({})}
        className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        清除全部
      </button>
    </div>
  );
}
