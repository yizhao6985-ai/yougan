import type { RevisionIntent } from "@yougan/domain";
import { normalizeRevisionQuote, previewSelectionLabel } from "@yougan/domain";
import { Trash2Icon } from "lucide-react";

import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function RevisionIntentListItem({
  item,
  onRemove,
  index,
  presentation = "compact",
  className,
}: {
  item: RevisionIntent;
  onRemove?: (intentId: string) => void;
  index?: number;
  presentation?: "compact" | "panel";
  className?: string;
}) {
  const quote = normalizeRevisionQuote(item.anchor?.quote);
  const isPanel = presentation === "panel";

  return (
    <li
      className={cn(
        isPanel
          ? "group relative overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm transition hover:border-primary/25 hover:shadow-md"
          : "rounded-md border border-border/70 bg-background/80 px-2.5 py-2 text-xs leading-5",
        className,
      )}
    >
      {isPanel ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0.5 bg-primary/35 transition group-hover:bg-primary/55"
        />
      ) : null}

      <div
        className={cn(
          "flex items-start justify-between gap-2",
          isPanel && "px-3.5 py-3",
        )}
      >
        <div className="flex min-w-0 flex-1 gap-2.5">
          {isPanel && index != null ? (
            <span
              aria-hidden
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold tabular-nums text-primary"
            >
              {index}
            </span>
          ) : null}

          <div className="min-w-0 flex-1 space-y-1.5">
            {quote ? (
              <p
                className={cn(
                  "text-muted-foreground",
                  isPanel
                    ? "rounded-md border border-border/60 bg-muted/45 px-2.5 py-1.5 text-[11px] leading-5"
                    : "text-xs leading-5",
                )}
              >
                <span className={isPanel ? "text-primary/80" : undefined}>
                  {CHAT_COPY.previewSelection.tagPrefix}
                </span>
                {previewSelectionLabel(quote, isPanel ? 56 : 48)}」
              </p>
            ) : null}
            <p
              className={cn(
                "text-foreground",
                isPanel ? "text-sm leading-6" : "text-xs leading-5",
              )}
            >
              {item.instruction}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onRemove ? (
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive",
                isPanel ? "px-2 py-1.5 text-[11px]" : "text-xs",
              )}
              onClick={() => onRemove(item.id)}
            >
              {isPanel ? (
                <Trash2Icon className="size-3.5 shrink-0" aria-hidden />
              ) : null}
              {CHAT_COPY.revisionPanel.remove}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
