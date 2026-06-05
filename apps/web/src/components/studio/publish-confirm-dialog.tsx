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
import {
  DISCOVER_FORMATS,
  DISCOVER_MEDIA_TYPES,
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  sortMediaModalities,
  type MediaModalityId,
  type PublicationMetadataOverrides,
  type PublicationMetadataPreview,
} from "@/lib/discover-taxonomy";
import { PUBLISH } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

type PublishConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (metadata: PublicationMetadataOverrides) => Promise<void>;
  isSubmitting?: boolean;
  preview: PublicationMetadataPreview | undefined;
  previewLoading: boolean;
  previewError: boolean;
};

function MetadataSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MediaTypesPicker({
  value,
  onChange,
}: {
  value: MediaModalityId[];
  onChange: (value: MediaModalityId[]) => void;
}) {
  const toggle = (id: MediaModalityId) => {
    const next = new Set(value);
    if (next.has(id)) {
      if (next.size === 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(sortMediaModalities(next));
  };

  return (
    <div className="space-y-1.5 sm:col-span-2">
      <label className="text-xs font-medium text-muted-foreground">
        {PUBLISH.fieldMedia}
      </label>
      <div className="flex flex-wrap gap-2">
        {DISCOVER_MEDIA_TYPES.map((option) => {
          const active = value.includes(option.id as MediaModalityId);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id as MediaModalityId)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PublishMetadataForm({
  preview,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  preview: PublicationMetadataPreview;
  onConfirm: (metadata: PublicationMetadataOverrides) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [draft, setDraft] = useState<PublicationMetadataOverrides>(() => ({
    platform: preview.metadata.platform,
    contentFormat: preview.metadata.contentFormat,
    topicCategory: preview.metadata.topicCategory,
    mediaTypes: preview.metadata.mediaTypes,
  }));

  const previewTags = preview.labels
    ? [
        preview.labels.contentFormat,
        preview.labels.topicCategory,
        preview.labels.mediaTypes,
      ].filter(Boolean)
    : [];

  return (
    <>
      <div className="space-y-4">
        {previewTags.length > 0 ? (
          <div className="rounded-lg border border-border/80 bg-secondary/40 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              {PUBLISH.inferredTags}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {previewTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <MetadataSelect
            label={PUBLISH.fieldFormat}
            value={draft.contentFormat ?? ""}
            options={DISCOVER_FORMATS}
            onChange={(value) =>
              setDraft((current) => ({ ...current, contentFormat: value }))
            }
          />
          <MetadataSelect
            label={PUBLISH.fieldTopic}
            value={draft.topicCategory ?? ""}
            options={DISCOVER_TOPIC_CATEGORIES}
            onChange={(value) =>
              setDraft((current) => ({ ...current, topicCategory: value }))
            }
          />
          <MetadataSelect
            label={PUBLISH.fieldPlatform}
            value={draft.platform ?? ""}
            options={DISCOVER_PLATFORMS}
            onChange={(value) =>
              setDraft((current) => ({ ...current, platform: value }))
            }
          />
          <MediaTypesPicker
            value={(draft.mediaTypes ?? ["text"]) as MediaModalityId[]}
            onChange={(mediaTypes) =>
              setDraft((current) => ({ ...current, mediaTypes }))
            }
          />
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
          disabled={isSubmitting || !draft.contentFormat}
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
        preview.metadata.platform,
        preview.metadata.contentFormat,
        preview.metadata.topicCategory,
        preview.metadata.mediaTypes.join(","),
      ].join("\u0000")
    : "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{PUBLISH.confirmTitle}</DialogTitle>
          <DialogDescription>{PUBLISH.confirmDescription}</DialogDescription>
        </DialogHeader>

        {previewLoading ? (
          <p className="text-sm text-muted-foreground">{PUBLISH.previewLoading}</p>
        ) : previewError || !preview ? (
          <p className="text-sm text-red-600">{PUBLISH.previewError}</p>
        ) : (
          <PublishMetadataForm
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
