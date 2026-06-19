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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DISCOVER_TOPIC_CATEGORIES,
  type PublicationSummaryOverrides,
  type PublicationSummaryPreview,
} from "@yougan/domain";
import { PUBLISH } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

type PublishConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (summary: PublicationSummaryOverrides) => Promise<void>;
  isSubmitting?: boolean;
  preview: PublicationSummaryPreview | undefined;
  previewLoading: boolean;
  previewError: boolean;
};

function FeedCardPreview({
  title,
  hook,
  coverUrl,
  compositionLabel,
  consumptionHint,
  topicLabel,
}: {
  title: string;
  hook: string;
  coverUrl: string | null;
  compositionLabel: string;
  consumptionHint: string | null;
  topicLabel: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <div
        className={cn(
          "aspect-[4/3] bg-secondary/50",
          coverUrl
            ? "bg-cover bg-center"
            : "bg-gradient-to-br from-accent/50 via-card to-secondary/40",
        )}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      />
      <div className="space-y-2 p-4">
        {(compositionLabel || topicLabel) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {compositionLabel ? (
              <span className="font-medium text-primary/90">
                {compositionLabel}
              </span>
            ) : null}
            {compositionLabel && topicLabel ? (
              <span className="text-muted-foreground/50">·</span>
            ) : null}
            {topicLabel ? (
              <span className="text-muted-foreground">{topicLabel}</span>
            ) : null}
          </div>
        )}
        <h4 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {title}
        </h4>
        {hook ? (
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {hook}
          </p>
        ) : null}
        {consumptionHint ? (
          <p className="text-xs text-muted-foreground/80">{consumptionHint}</p>
        ) : null}
      </div>
    </div>
  );
}

function PublishSummaryForm({
  preview,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  preview: PublicationSummaryPreview;
  onConfirm: (summary: PublicationSummaryOverrides) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { summary, labels, coverOptions } = preview;
  const [draft, setDraft] = useState<PublicationSummaryOverrides>(() => ({
    title: summary.title,
    hook: summary.hook,
    compositionLabel: summary.compositionLabel,
    topicCategory: summary.topicCategory,
    coverBlockId: summary.cover.sourceBlockId,
  }));

  const selectedCover =
    coverOptions.find((item) => item.blockId === draft.coverBlockId) ??
    coverOptions[0] ??
    null;

  const coverUrl = selectedCover?.url ?? summary.cover.url ?? null;

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {PUBLISH.feedPreviewHeading}
          </p>
          <FeedCardPreview
            title={draft.title ?? summary.title}
            hook={draft.hook ?? summary.hook}
            coverUrl={coverUrl}
            compositionLabel={draft.compositionLabel ?? summary.compositionLabel}
            consumptionHint={labels.consumptionHint}
            topicLabel={
              DISCOVER_TOPIC_CATEGORIES.find(
                (item) => item.id === draft.topicCategory,
              )?.label ?? labels.topicCategory
            }
          />
        </div>

        <div className="rounded-lg border border-border/80 bg-secondary/30 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            {PUBLISH.blockCompositionHeading}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {summary.compositionLabel}
            {labels.consumptionHint ? (
              <span className="text-muted-foreground">
                {" "}
                · {labels.consumptionHint}
              </span>
            ) : null}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {PUBLISH.fieldTitle}
            </label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.title ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {PUBLISH.fieldHook}
            </label>
            <Textarea
              value={draft.hook ?? ""}
              rows={3}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  hook: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {PUBLISH.fieldCompositionLabel}
            </label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.compositionLabel ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  compositionLabel: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {PUBLISH.fieldTopic}
            </label>
            <Select
              value={draft.topicCategory ?? ""}
              onValueChange={(value) =>
                setDraft((current) => ({ ...current, topicCategory: value }))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCOVER_TOPIC_CATEGORIES.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {coverOptions.length > 1 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {PUBLISH.fieldCover}
              </label>
              <div className="flex flex-wrap gap-2">
                {coverOptions.map((option) => {
                  const active = draft.coverBlockId === option.blockId;
                  return (
                    <button
                      key={option.blockId}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          coverBlockId: option.blockId,
                        }))
                      }
                      className={cn(
                        "overflow-hidden rounded-md border-2 transition",
                        active
                          ? "border-primary"
                          : "border-transparent opacity-80 hover:opacity-100",
                      )}
                    >
                      <img
                        src={option.url}
                        alt={option.label}
                        className="size-16 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {PUBLISH.cancel}
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || !draft.title?.trim() || !draft.hook?.trim()}
          onClick={() => void onConfirm(draft)}
        >
          {isSubmitting ? PUBLISH.publishing : PUBLISH.confirmPublish}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PublishConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
  preview,
  previewLoading,
  previewError,
}: PublishConfirmDialogProps) {
  const previewKey = preview
    ? [
        preview.summary.title,
        preview.summary.hook,
        preview.summary.compositionLabel,
        preview.summary.cover.sourceBlockId,
      ].join("\u0000")
    : "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{PUBLISH.confirmTitle}</DialogTitle>
          <DialogDescription>{PUBLISH.confirmDescription}</DialogDescription>
        </DialogHeader>

        {previewLoading ? (
          <p className="text-sm text-muted-foreground">{PUBLISH.previewLoading}</p>
        ) : previewError || !preview ? (
          <p className="text-sm text-red-600">{PUBLISH.previewError}</p>
        ) : (
          <PublishSummaryForm
            key={previewKey}
            preview={preview}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        )}

        {previewLoading || previewError || !preview ? (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {PUBLISH.cancel}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
