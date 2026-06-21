import { useState } from "react";

import { RevisionIntentListItem } from "@/components/studio/revision-intent-list-item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RevisionIntent } from "@yougan/domain";
import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function RevisionListTrigger({
  count,
  onOpen,
  className,
}: {
  count: number;
  onOpen: () => void;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      aria-label={CHAT_COPY.revisionPanel.openList}
      onClick={onOpen}
    >
      {CHAT_COPY.revisionPanel.trigger(count)}
    </Button>
  );
}

export function RevisionListDialog({
  open,
  onOpenChange,
  anchoredItems,
  unanchored,
  onRemoveIntent,
  onLocateBlock,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchoredItems: RevisionIntent[];
  unanchored: RevisionIntent[];
  onRemoveIntent?: (intentId: string) => void;
  onLocateBlock?: (blockId: string) => void;
}) {
  const handleLocate = (blockId: string) => {
    onLocateBlock?.(blockId);
    onOpenChange(false);
  };

  const totalCount = anchoredItems.length + unanchored.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(80vh,32rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="space-y-1 border-b border-border/80 px-5 py-4 text-left">
          <DialogTitle className="text-base">
            {CHAT_COPY.revisionPanel.dialogTitle}
            {totalCount > 0 ? (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                · {totalCount}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription className="text-xs leading-5">
            {CHAT_COPY.revisionPanel.dialogHint}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {anchoredItems.length > 0 ? (
            <ul className="space-y-2">
              {anchoredItems.map((item) => (
                <RevisionIntentListItem
                  key={item.id}
                  item={item}
                  showLocate
                  onLocate={handleLocate}
                  onRemove={onRemoveIntent}
                />
              ))}
            </ul>
          ) : null}

          {unanchored.length > 0 ? (
            <div className={cn(anchoredItems.length > 0 && "mt-4", "space-y-2")}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {CHAT_COPY.revisionPanel.unanchoredSection}
              </p>
              <ul className="space-y-2">
                {unanchored.map((item) => (
                  <RevisionIntentListItem
                    key={item.id}
                    item={item}
                    onRemove={onRemoveIntent}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RevisionListControls({
  count,
  anchoredItems,
  unanchored,
  onRemoveIntent,
  onLocateBlock,
}: {
  count: number;
  anchoredItems: RevisionIntent[];
  unanchored: RevisionIntent[];
  onRemoveIntent?: (intentId: string) => void;
  onLocateBlock?: (blockId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (count <= 0) return null;

  return (
    <>
      <RevisionListTrigger count={count} onOpen={() => setOpen(true)} />
      <RevisionListDialog
        open={open}
        onOpenChange={setOpen}
        anchoredItems={anchoredItems}
        unanchored={unanchored}
        onRemoveIntent={onRemoveIntent}
        onLocateBlock={onLocateBlock}
      />
    </>
  );
}
