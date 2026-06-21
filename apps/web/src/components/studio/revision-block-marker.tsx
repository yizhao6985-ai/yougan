import { ChevronDownIcon } from "lucide-react";

import { RevisionIntentListItem } from "@/components/studio/revision-intent-list-item";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { RevisionIntent } from "@yougan/domain";
import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function RevisionBlockMarker({
  items,
  expanded,
  onExpandedChange,
  onRemoveIntent,
  className,
}: {
  items: RevisionIntent[];
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  onRemoveIntent?: (intentId: string) => void;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <Collapsible
      open={expanded}
      onOpenChange={onExpandedChange}
      className={cn("mt-2", className)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary transition hover:bg-primary/15"
        >
          {CHAT_COPY.revisionPanel.blockMarker(items.length)}
          <ChevronDownIcon
            className={cn(
              "size-3 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5">
        <ul className="space-y-1.5">
          {items.map((item) => (
            <RevisionIntentListItem
              key={item.id}
              item={item}
              onRemove={onRemoveIntent}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
