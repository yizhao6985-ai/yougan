import { useEffect, useState } from "react";

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
import { usePublicationMetadataPreviewQuery } from "@/hooks/queries/publications";
import {
  DISCOVER_FORMATS,
  DISCOVER_MEDIA_TYPES,
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  type PublicationMetadataOverrides,
} from "@/lib/discover-taxonomy";
import { PUBLISH } from "@/lib/site-copy";

type PublishConfirmDialogProps = {
  workId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (metadata: PublicationMetadataOverrides) => Promise<void>;
  isSubmitting?: boolean;
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

export function PublishConfirmDialog({
  workId,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: PublishConfirmDialogProps) {
  const { data, isLoading, isError } = usePublicationMetadataPreviewQuery(
    workId,
    open,
  );
  const [draft, setDraft] = useState<PublicationMetadataOverrides>({});

  useEffect(() => {
    if (!data?.metadata) return;
    setDraft({
      platform: data.metadata.platform,
      contentFormat: data.metadata.contentFormat,
      topicCategory: data.metadata.topicCategory,
      mediaType: data.metadata.mediaType,
    });
  }, [data]);

  const handleConfirm = async () => {
    await onConfirm(draft);
  };

  const previewTags = data?.labels
    ? [
        data.labels.contentFormat,
        data.labels.topicCategory,
        data.labels.mediaType,
      ].filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{PUBLISH.confirmTitle}</DialogTitle>
          <DialogDescription>{PUBLISH.confirmDescription}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{PUBLISH.previewLoading}</p>
        ) : isError ? (
          <p className="text-sm text-red-600">{PUBLISH.previewError}</p>
        ) : (
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
                label={PUBLISH.fieldMedia}
                value={draft.mediaType ?? ""}
                options={DISCOVER_MEDIA_TYPES}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, mediaType: value }))
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
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {PUBLISH.cancel}
          </Button>
          <Button
            type="button"
            disabled={isLoading || isError || isSubmitting || !draft.contentFormat}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? PUBLISH.publishing : PUBLISH.confirmPublish}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
