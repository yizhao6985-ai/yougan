import {
  AlertTriangleIcon,
  GitBranchIcon,
  HistoryIcon,
  RotateCcwIcon,
  SplitIcon,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { chatStreamBlock } from "@/components/studio/chat-stream-block";
import {
  useDuplicateWorkMutation,
  useRestoreWorkVersionMutation,
  useWorkVersionsQuery,
} from "@/hooks/queries/versions";
import { formatVersionTime } from "@/lib/version-labels";
import { WORK_HISTORY_PANEL } from "@/lib/site-copy";
import type { Work, WorkVersion } from "@/lib/types";
import { cn } from "@/lib/utils";

type WorkHistoryPanelProps = {
  workId: string;
  headVersionId?: string | null;
  compact?: boolean;
  onDuplicated?: (workId: string) => void;
  onRestored?: (work: Work) => void | Promise<void>;
};

type PendingRestore = WorkVersion;

type HistoryPanelSectionProps = {
  icon: LucideIcon;
  title: string;
  hint: string;
  accent?: "branch" | "timeline";
  children: ReactNode;
};

function HistoryPanelSection({
  icon: Icon,
  title,
  hint,
  accent = "timeline",
  children,
}: HistoryPanelSectionProps) {
  const isBranch = accent === "branch";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm",
        isBranch ? "border-primary/25 bg-card" : "border-border/90 bg-card",
      )}
    >
      <header
        className={cn(
          "flex items-start gap-3 border-b px-4 py-3.5",
          isBranch
            ? "border-primary/15 bg-primary/[0.06]"
            : "border-border/70 bg-muted/45",
        )}
      >
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            isBranch
              ? "bg-primary/12 text-primary"
              : "bg-background text-muted-foreground shadow-sm ring-1 ring-border/60",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
            {hint}
          </p>
        </div>
      </header>
      <div className="space-y-3 px-4 py-4">{children}</div>
    </section>
  );
}

export function WorkHistoryPanel({
  workId,
  headVersionId,
  compact,
  onDuplicated,
  onRestored,
}: WorkHistoryPanelProps) {
  const versionsQuery = useWorkVersionsQuery(workId);
  const restoreMutation = useRestoreWorkVersionMutation(workId, { onRestored });
  const duplicateMutation = useDuplicateWorkMutation(workId);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(
    null,
  );

  const versions = versionsQuery.data ?? [];
  // 版本列表由 API 按 headVersionId 排序；优先信任列表，避免作品缓存里的 head 滞后。
  const resolvedHeadVersionId =
    versions.length > 0 ? versions[0].id : (headVersionId ?? null);

  const handleRestore = () => {
    if (!pendingRestore) return;
    void restoreMutation
      .mutateAsync(pendingRestore.id)
      .then(() => setPendingRestore(null))
      .catch(() => undefined);
  };

  const handleDuplicate = (versionId?: string) => {
    void duplicateMutation
      .mutateAsync({ versionId })
      .then(({ work }) => onDuplicated?.(work.id))
      .catch(() => undefined);
  };

  if (versionsQuery.isLoading) {
    return <p className={chatStreamBlock.muted}>{WORK_HISTORY_PANEL.loading}</p>;
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-5" : "gap-6")}>
      <HistoryPanelSection
        icon={GitBranchIcon}
        title={WORK_HISTORY_PANEL.exploreTitle}
        hint={WORK_HISTORY_PANEL.exploreHint}
        accent="branch"
      >
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full gap-1.5"
          disabled={duplicateMutation.isPending}
          onClick={() => handleDuplicate()}
        >
          <GitBranchIcon className="size-3.5" />
          {duplicateMutation.isPending
            ? WORK_HISTORY_PANEL.duplicating
            : WORK_HISTORY_PANEL.duplicateAction}
        </Button>
      </HistoryPanelSection>

      <HistoryPanelSection
        icon={HistoryIcon}
        title={WORK_HISTORY_PANEL.timelineTitle}
        hint={WORK_HISTORY_PANEL.timelineHint}
        accent="timeline"
      >
        {versions.length > 0 ? <RestoreNotice /> : null}

        {versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/35 px-4 py-4">
            <p className={chatStreamBlock.muted}>{WORK_HISTORY_PANEL.empty}</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {versions.map((version) => (
              <li key={version.id}>
                <VersionRow
                  version={version}
                  isHead={version.id === resolvedHeadVersionId}
                  disableRestore={
                    restoreMutation.isPending ||
                    version.id === resolvedHeadVersionId
                  }
                  disableFork={duplicateMutation.isPending}
                  onRestore={() => setPendingRestore(version)}
                  onFork={() => handleDuplicate(version.id)}
                />
              </li>
            ))}
          </ol>
        )}
      </HistoryPanelSection>

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
            <>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">
                  {pendingRestore.summary}
                </p>
                <p className={cn(chatStreamBlock.caption, "mt-1")}>
                  {formatVersionTime(pendingRestore.createdAt)}
                </p>
              </div>
              <RestoreWarning />
              <p className={cn(chatStreamBlock.caption, "leading-6")}>
                {WORK_HISTORY_PANEL.restoreAlternative}
              </p>
            </>
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
              variant="destructive"
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

function RestoreNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5",
        className,
      )}
    >
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
      <p className="text-xs leading-5 text-foreground/85">
        {WORK_HISTORY_PANEL.restoreNotice}
      </p>
    </div>
  );
}

function RestoreWarning() {
  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <AlertTriangleIcon className="size-4 shrink-0 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          {WORK_HISTORY_PANEL.restoreWarningTitle}
        </p>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-foreground/85">
        {WORK_HISTORY_PANEL.restoreWarningItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function VersionRow({
  version,
  isHead,
  disableRestore,
  disableFork,
  onRestore,
  onFork,
}: {
  version: WorkVersion;
  isHead: boolean;
  disableRestore: boolean;
  disableFork: boolean;
  onRestore: () => void;
  onFork: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        isHead
          ? "border-primary/20 bg-primary/[0.04]"
          : "border-border/80 bg-muted/25",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isHead ? (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {WORK_HISTORY_PANEL.headBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-foreground/90">
            {version.summary}
          </p>
          <p className={cn(chatStreamBlock.caption, "mt-1")}>
            {formatVersionTime(version.createdAt)}
          </p>
        </div>
        {!isHead ? (
          <div className="flex shrink-0 flex-col gap-1 border-l border-border/60 pl-2">
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
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 text-xs"
              disabled={disableFork}
              title={WORK_HISTORY_PANEL.forkHint}
              onClick={onFork}
            >
              <SplitIcon className="size-3.5" />
              {WORK_HISTORY_PANEL.forkFromVersion}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
