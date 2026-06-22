import { useState } from "react";
import { ChevronRightIcon, ListChecksIcon, SparklesIcon } from "lucide-react";

import { RevisionIntentListItem } from "@/components/studio/revision-intent-list-item";
import { Badge } from "@/components/ui/badge";
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

function RevisionSectionHeading({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center gap-2", className)}>
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border/70" aria-hidden />
      <Badge
        variant="secondary"
        className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] font-medium tabular-nums"
      >
        {count}
      </Badge>
    </div>
  );
}

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
    <button
      type="button"
      aria-label={CHAT_COPY.revisionPanel.openList}
      onClick={onOpen}
      className={cn(
        "group inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-primary/25 bg-gradient-to-r from-primary/12 via-primary/6 to-transparent pl-2 pr-2.5 text-left shadow-sm transition hover:border-primary/40 hover:from-primary/16 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition group-hover:bg-primary/20">
        <ListChecksIcon className="size-3" aria-hidden />
      </span>
      <span className="truncate text-xs font-medium text-foreground">
        {CHAT_COPY.revisionPanel.dialogTitle}
      </span>
      <span className="inline-flex min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-primary-foreground">
        {count}
      </span>
      <ChevronRightIcon
        className="size-3 shrink-0 text-muted-foreground/70 transition group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </button>
  );
}

export function RevisionListDialog({
  open,
  onOpenChange,
  anchoredItems,
  unanchored,
  onRemoveIntent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchoredItems: RevisionIntent[];
  unanchored: RevisionIntent[];
  onRemoveIntent?: (intentId: string) => void;
}) {
  const totalCount = anchoredItems.length + unanchored.length;
  let itemIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden border-border/80 p-0 shadow-xl sm:max-w-lg">
        <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/10 via-accent/35 to-background px-5 pb-4 pt-5">
          <DialogHeader className="space-y-3 pr-8 text-left">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <ListChecksIcon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base font-semibold tracking-tight">
                    {CHAT_COPY.revisionPanel.dialogTitle}
                  </DialogTitle>
                  {totalCount > 0 ? (
                    <Badge className="h-5 rounded-full px-2 text-[10px] font-semibold tabular-nums">
                      {totalCount}
                    </Badge>
                  ) : null}
                </div>
                <DialogDescription className="text-xs leading-5 text-muted-foreground">
                  {CHAT_COPY.revisionPanel.dialogHint}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 [scrollbar-gutter:stable]">
          {totalCount === 0 ? (
            <div className="flex min-h-[8rem] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-8 text-center">
              <ListChecksIcon
                className="size-8 text-muted-foreground/40"
                aria-hidden
              />
              <p className="mt-3 text-sm text-muted-foreground">
                {CHAT_COPY.revisionPanel.empty}
              </p>
            </div>
          ) : (
            <>
              {anchoredItems.length > 0 ? (
                <section>
                  <RevisionSectionHeading
                    label={CHAT_COPY.revisionPanel.anchoredSection}
                    count={anchoredItems.length}
                  />
                  <ul className="space-y-2.5">
                    {anchoredItems.map((item) => {
                      itemIndex += 1;
                      const currentIndex = itemIndex;
                      return (
                        <RevisionIntentListItem
                          key={item.id}
                          item={item}
                          index={currentIndex}
                          presentation="panel"
                          onRemove={onRemoveIntent}
                        />
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {unanchored.length > 0 ? (
                <section className={cn(anchoredItems.length > 0 && "mt-5")}>
                  <RevisionSectionHeading
                    label={CHAT_COPY.revisionPanel.unanchoredSection}
                    count={unanchored.length}
                  />
                  <ul className="space-y-2.5">
                    {unanchored.map((item) => {
                      itemIndex += 1;
                      const currentIndex = itemIndex;
                      return (
                        <RevisionIntentListItem
                          key={item.id}
                          item={item}
                          index={currentIndex}
                          presentation="panel"
                          onRemove={onRemoveIntent}
                        />
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>

        {totalCount > 0 ? (
          <div className="border-t border-border/60 bg-muted/35 px-5 py-3">
            <p className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
              <SparklesIcon
                className="mt-0.5 size-3.5 shrink-0 text-primary/70"
                aria-hidden
              />
              <span>{CHAT_COPY.revisionPanel.dialogFooter}</span>
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function RevisionListControls({
  count,
  anchoredItems,
  unanchored,
  onRemoveIntent,
}: {
  count: number;
  anchoredItems: RevisionIntent[];
  unanchored: RevisionIntent[];
  onRemoveIntent?: (intentId: string) => void;
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
      />
    </>
  );
}
