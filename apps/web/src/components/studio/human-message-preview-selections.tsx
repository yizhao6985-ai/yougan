import type { HumanPreviewSelection } from "@yougan/domain";
import { previewSelectionLabel } from "@yougan/domain";

import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function HumanMessagePreviewSelections({
  items,
  className,
}: {
  items: HumanPreviewSelection[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item, index) => (
        <span
          key={`${item.blockId}-${index}`}
          className="inline-flex max-w-full rounded-md border border-border/80 bg-muted/50 px-2 py-1 text-xs text-foreground"
          title={item.quote}
        >
          <span className="truncate">
            {CHAT_COPY.previewSelection.tagPrefix}
            {previewSelectionLabel(item.quote, 40)}」
          </span>
        </span>
      ))}
    </div>
  );
}
