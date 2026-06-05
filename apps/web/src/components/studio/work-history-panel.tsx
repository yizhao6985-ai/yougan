import { CopyIcon, HistoryIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import {
  useDuplicateWorkMutation,
  useRestoreWorkRevisionMutation,
  useWorkRevisionsQuery,
} from "@/hooks/queries/revisions";
import {
  formatRevisionTime,
  revisionPhaseLabel,
} from "@/lib/revision-labels";
import { WORK_HISTORY_PANEL } from "@/lib/site-copy";
import type { WorkRevisionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

type WorkHistoryPanelProps = {
  workId: string;
  compact?: boolean;
  onDuplicated?: (workId: string) => void;
};

type PendingRestore = WorkRevisionDTO;

export function WorkHistoryPanel({
  workId,
  compact,
  onDuplicated,
}: WorkHistoryPanelProps) {
  const revisionsQuery = useWorkRevisionsQuery(workId);
  const restoreMutation = useRestoreWorkRevisionMutation(workId);
  const duplicateMutation = useDuplicateWorkMutation(workId);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(
    null,
  );

  const revisions = revisionsQuery.data ?? [];

  const handleRestore = () => {
    if (!pendingRestore) return;
    void restoreMutation
      .mutateAsync(pendingRestore.id)
      .then(() => setPendingRestore(null))
      .catch(() => undefined);
  };

  const handleDuplicate = (revisionId?: string) => {
    void duplicateMutation
      .mutateAsync({ revisionId })
      .then(({ work }) => onDuplicated?.(work.id))
      .catch(() => undefined);
  };

  if (revisionsQuery.isLoading) {
    return <p className={chatStreamBlock.muted}>{WORK_HISTORY_PANEL.loading}</p>;
  }

  return (
    <div className={cn(chatStreamBlock.stack, compact && "gap-2.5")}>
      <div className={chatStreamBlock.inset}>
        <p className={chatStreamBlock.headerTitle}>{WORK_HISTORY_PANEL.duplicateTitle}</p>
        <p className={cn(chatStreamBlock.caption, "mt-1")}>
          {WORK_HISTORY_PANEL.duplicateHint}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-3 w-full gap-1.5"
          disabled={duplicateMutation.isPending}
          onClick={() => handleDuplicate()}
        >
          <CopyIcon className="size-3.5" />
          {duplicateMutation.isPending
            ? WORK_HISTORY_PANEL.duplicating
            : WORK_HISTORY_PANEL.duplicateAction}
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <HistoryIcon className="size-4 text-muted-foreground" />
          <p className={chatStreamBlock.headerTitle}>
            {WORK_HISTORY_PANEL.timelineTitle}
          </p>
        </div>
        <p className={cn(chatStreamBlock.caption, "mb-3")}>
          {WORK_HISTORY_PANEL.timelineHint}
        </p>

        {revisions.length === 0 ? (
          <p className={chatStreamBlock.muted}>{WORK_HISTORY_PANEL.empty}</p>
        ) : (
          <ol className="space-y-2">
            {revisions.map((revision, index) => (
              <li key={revision.id}>
                <RevisionRow
                  revision={revision}
                  isHead={index === 0}
                  disableRestore={restoreMutation.isPending || index === 0}
                  disableDuplicate={duplicateMutation.isPending}
                  onRestore={() => setPendingRestore(revision)}
                  onDuplicate={() => handleDuplicate(revision.id)}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      <Dialog
        open={Boolean(pendingRestore)}
        onOpenChange={(open) => {
          if (!open) setPendingRestore(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{WORK_HISTORY_PANEL.restoreTitle}</DialogTitle>
            <DialogDescription>
              {WORK_HISTORY_PANEL.restoreDescription}
            </DialogDescription>
          </DialogHeader>
          {pendingRestore ? (
            <div className={chatStreamBlock.inset}>
              <p className="text-sm font-medium text-foreground">
                {pendingRestore.summary}
              </p>
              <p className={cn(chatStreamBlock.caption, "mt-1")}>
                {revisionPhaseLabel(pendingRestore.phase)} ·{" "}
                {formatRevisionTime(pendingRestore.createdAt)}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRestore(null)}
            >
              {WORK_HISTORY_PANEL.cancel}
            </Button>
            <Button
              type="button"
              disabled={restoreMutation.isPending}
              onClick={handleRestore}
            >
              {restoreMutation.isPending
                ? WORK_HISTORY_PANEL.restoring
                : WORK_HISTORY_PANEL.confirmRestore}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RevisionRow({
  revision,
  isHead,
  disableRestore,
  disableDuplicate,
  onRestore,
  onDuplicate,
}: {
  revision: WorkRevisionDTO;
  isHead: boolean;
  disableRestore: boolean;
  disableDuplicate: boolean;
  onRestore: () => void;
  onDuplicate: () => void;
}) {
  return (
    <ChatStreamBlock className="px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                chatStreamBlock.headerMeta,
                revision.phase === "preview" &&
                  "text-primary",
              )}
            >
              {revisionPhaseLabel(revision.phase)}
            </span>
            {isHead ? (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {WORK_HISTORY_PANEL.headBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-foreground/90">
            {revision.summary}
          </p>
          <p className={cn(chatStreamBlock.caption, "mt-1")}>
            {formatRevisionTime(revision.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          {!isHead ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 text-xs"
              disabled={disableRestore}
              onClick={onRestore}
            >
              <RotateCcwIcon className="size-3.5" />
              {WORK_HISTORY_PANEL.restore}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1 text-xs"
            disabled={disableDuplicate}
            onClick={onDuplicate}
          >
            <CopyIcon className="size-3.5" />
            {WORK_HISTORY_PANEL.duplicateFromHere}
          </Button>
        </div>
      </div>
    </ChatStreamBlock>
  );
}
