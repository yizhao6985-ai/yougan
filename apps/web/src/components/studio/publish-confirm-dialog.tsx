import { useMemo, useRef, useState } from "react";
import { CheckIcon, ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";

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
  listPublicationCoverOptions,
  type PublicationSummaryOverrides,
  type PublicationSummaryPreview,
  type WorkPreview,
} from "@yougan/domain";
import { PUBLISH } from "@/lib/site-copy";
import { ApiError } from "@/services/client";
import { uploadImage } from "@/services/upload";
import { cn } from "@/lib/utils";

type PublishConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (summary: PublicationSummaryOverrides) => Promise<void>;
  isSubmitting?: boolean;
  preview: PublicationSummaryPreview | undefined;
  workPreview?: WorkPreview | null;
  previewLoading: boolean;
  previewError: boolean;
};

function resolveDraftCoverUrl(
  draft: PublicationSummaryOverrides,
  summary: PublicationSummaryPreview["summary"],
  coverOptions: ReturnType<typeof listPublicationCoverOptions>,
): string | null {
  const customUrl = draft.coverUrl?.trim();
  if (customUrl) return customUrl;

  if (draft.coverUrl === null && draft.coverImageId === null) {
    return null;
  }

  const imageId =
    draft.coverImageId !== undefined
      ? draft.coverImageId?.trim() || null
      : summary.cover.sourceImageId;

  if (imageId) {
    return (
      (coverOptions.find((option) => option.imageId === imageId)?.url ??
        summary.cover.url.trim()) ||
      null
    );
  }

  return summary.cover.url.trim() || null;
}

function buildCoverOverrides(
  draft: PublicationSummaryOverrides,
): Pick<PublicationSummaryOverrides, "coverUrl" | "coverImageId"> {
  const customUrl = draft.coverUrl?.trim();
  if (customUrl) {
    return { coverUrl: customUrl, coverImageId: null };
  }
  if (draft.coverUrl === null && draft.coverImageId === null) {
    return { coverUrl: null, coverImageId: null };
  }
  if (draft.coverImageId !== undefined) {
    return {
      coverImageId: draft.coverImageId?.trim() || null,
    };
  }
  return {};
}

function FeedCardPreview({
  title,
  hook,
  coverUrl,
  compositionLabel,
  consumptionHint,
  topicLabel,
  coverUploading,
  onCoverClick,
  onCoverRemove,
}: {
  title: string;
  hook: string;
  coverUrl: string | null;
  compositionLabel: string;
  consumptionHint: string | null;
  topicLabel: string | null;
  coverUploading?: boolean;
  onCoverClick: () => void;
  onCoverRemove?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <div className="group relative">
        <button
          type="button"
          onClick={onCoverClick}
          disabled={coverUploading}
          className={cn(
            "relative block aspect-[4/3] w-full overflow-hidden bg-secondary/50 transition hover:opacity-95",
            coverUrl
              ? "bg-cover bg-center"
              : "bg-gradient-to-br from-accent/50 via-card to-secondary/40",
          )}
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        >
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/0 text-white transition group-hover:bg-black/35",
              coverUploading && "bg-black/35",
            )}
          >
            {coverUploading ? (
              <Loader2Icon className="size-6 animate-spin" />
            ) : (
              <>
                <ImagePlusIcon
                  className={cn(
                    "size-6 transition",
                    coverUrl
                      ? "opacity-0 group-hover:opacity-100"
                      : "text-muted-foreground group-hover:text-white",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition",
                    coverUrl
                      ? "opacity-0 group-hover:opacity-100"
                      : "text-muted-foreground group-hover:text-white",
                  )}
                >
                  {coverUrl ? PUBLISH.replaceCover : PUBLISH.uploadCover}
                </span>
              </>
            )}
          </div>
        </button>

        {coverUrl && onCoverRemove && !coverUploading ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCoverRemove();
            }}
            className="absolute right-2 top-2 rounded-full bg-black/55 p-1 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
            aria-label={PUBLISH.removeCover}
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

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

function CoverImagePicker({
  options,
  selectedImageId,
  customCoverActive,
  onSelect,
}: {
  options: ReturnType<typeof listPublicationCoverOptions>;
  selectedImageId: string | null;
  customCoverActive: boolean;
  onSelect: (imageId: string) => void;
}) {
  if (!options.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {PUBLISH.coverPickHeading}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {options.map((option) => {
          const selected =
            !customCoverActive && selectedImageId === option.imageId;
          return (
            <button
              key={option.imageId}
              type="button"
              onClick={() => onSelect(option.imageId)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border bg-muted/30 transition",
                selected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/80 hover:border-primary/40",
              )}
              aria-label={option.label}
              aria-pressed={selected}
            >
              <img
                src={option.url}
                alt=""
                className="size-full object-cover"
              />
              {selected ? (
                <span className="absolute inset-0 flex items-center justify-center bg-primary/15">
                  <CheckIcon className="size-4 text-primary" aria-hidden />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PublishSummaryForm({
  preview,
  workPreview,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  preview: PublicationSummaryPreview;
  workPreview?: WorkPreview | null;
  onConfirm: (summary: PublicationSummaryOverrides) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { summary, labels } = preview;
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const coverOptions = useMemo(
    () => listPublicationCoverOptions(workPreview),
    [workPreview],
  );
  const [draft, setDraft] = useState<PublicationSummaryOverrides>(() => ({
    title: summary.title,
    hook: summary.hook,
    compositionLabel: summary.compositionLabel,
    topicCategory: summary.topicCategory,
    coverImageId: summary.cover.sourceImageId ?? undefined,
    coverUrl: summary.cover.sourceImageId
      ? undefined
      : summary.cover.url.trim() || undefined,
  }));

  const coverUrl = resolveDraftCoverUrl(draft, summary, coverOptions);
  const customCoverActive = Boolean(draft.coverUrl?.trim());
  const selectedCoverImageId =
    draft.coverImageId !== undefined
      ? draft.coverImageId?.trim() || null
      : summary.cover.sourceImageId;

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    setCoverUploadError(null);
    setCoverUploading(true);
    try {
      const { url } = await uploadImage(file, "cover");
      setDraft((current) => ({
        ...current,
        coverUrl: url,
        coverImageId: undefined,
      }));
    } catch (err) {
      setCoverUploadError(
        err instanceof ApiError ? err.message : PUBLISH.coverUploadError,
      );
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    void onConfirm({
      title: draft.title,
      hook: draft.hook,
      compositionLabel: draft.compositionLabel,
      topicCategory: draft.topicCategory,
      ...buildCoverOverrides(draft),
    });
  };

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
            coverUploading={coverUploading}
            onCoverClick={() => coverInputRef.current?.click()}
            onCoverRemove={() =>
              setDraft((current) => ({
                ...current,
                coverUrl: null,
                coverImageId: null,
              }))
            }
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) =>
              void handleCoverUpload(event.target.files?.[0])
            }
          />
          {coverUploadError ? (
            <p className="mt-1.5 text-xs text-red-600">{coverUploadError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {PUBLISH.coverUploadHint}
            </p>
          )}
        </div>

        <CoverImagePicker
          options={coverOptions}
          selectedImageId={selectedCoverImageId}
          customCoverActive={customCoverActive}
          onSelect={(imageId) =>
            setDraft((current) => ({
              ...current,
              coverImageId: imageId,
              coverUrl: undefined,
            }))
          }
        />

        {coverOptions.length ? (
          <p className="text-xs text-muted-foreground">{PUBLISH.coverPickHint}</p>
        ) : null}

        <div className="grid gap-3 border-t border-border/60 pt-4">
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

          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
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
          disabled={
            isSubmitting ||
            coverUploading ||
            !draft.title?.trim() ||
            !draft.hook?.trim()
          }
          onClick={handleConfirm}
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
  workPreview,
  previewLoading,
  previewError,
}: PublishConfirmDialogProps) {
  const previewKey = preview
    ? [
        preview.summary.title,
        preview.summary.hook,
        preview.summary.compositionLabel,
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
            workPreview={workPreview}
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
