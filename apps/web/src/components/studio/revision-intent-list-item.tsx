import type { RevisionIntent } from "@yougan/domain";
import { previewSelectionLabel } from "@yougan/domain";

import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function RevisionIntentListItem({
  item,
  onRemove,
  onLocate,
  showLocate = false,
  className,
}: {
  item: RevisionIntent;
  onRemove?: (intentId: string) => void;
  onLocate?: (blockId: string) => void;
  showLocate?: boolean;
  className?: string;
}) {
  const blockId = item.anchor?.blockId?.trim();
  const quote = item.anchor?.quote?.trim();

  return (
    <li
      className={cn(
        "rounded-md border border-border/70 bg-background/80 px-2.5 py-2 text-xs leading-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          {quote ? (
            <p className="text-muted-foreground">
              {CHAT_COPY.previewSelection.tagPrefix}
              {previewSelectionLabel(quote, 48)}」
            </p>
          ) : null}
          <p className="text-foreground">{item.instruction}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showLocate && blockId && onLocate ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onLocate(blockId)}
            >
              {CHAT_COPY.revisionPanel.locate}
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onRemove(item.id)}
            >
              {CHAT_COPY.revisionPanel.remove}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
