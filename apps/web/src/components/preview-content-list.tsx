import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type {
  RevisionIntent,
  ScriptSegment,
  WorkPreview,
  WorkRevision,
} from "@yougan/domain";
import {
  openRevisionItems,
  PREVIEW_BODY_BLOCK_ID,
  previewImages,
  previewPlainText,
} from "@yougan/domain";

import { MarkdownContent } from "@/components/markdown-content";
import { PreviewImageGallery } from "@/components/preview-image-gallery";
import type { PreviewImageItem } from "@/components/preview-image-list";
import { PreviewImageFigure } from "@/components/preview-image-figure";
import { RevisionBlockMarker } from "@/components/studio/revision-block-marker";
import { Button } from "@/components/ui/button";
import { useOptionalComposerPreviewSelectionsContext } from "@/components/studio/composer-preview-selections-context";
import { groupRevisionItemsByBlock } from "@/lib/revision-display";
import { CHAT_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

function previewScriptSegments(preview: WorkPreview): ScriptSegment[] {
  const content = preview.content;
  if (content && "segments" in content && content.segments.length > 0) {
    return content.segments;
  }
  return [];
}

type SelectionToolbarState = {
  blockId: string;
  quote: string;
  top: number;
  left: number;
};

function PreviewTextBlock({
  body,
  blockId,
  revisionItems,
  expanded,
  onExpandedChange,
  onRemoveIntent,
  onSelectionReady,
}: {
  body: string;
  blockId: string;
  revisionItems: RevisionIntent[];
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  onRemoveIntent?: (intentId: string) => void;
  onSelectionReady?: (selection: SelectionToolbarState | null) => void;
}) {
  const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (!onSelectionReady) return;
    const selection = window.getSelection();
    const quote = selection?.toString().trim() ?? "";
    if (!quote) {
      onSelectionReady(null);
      return;
    }

    const container = event.currentTarget;
    if (!selection?.anchorNode || !container.contains(selection.anchorNode)) {
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    onSelectionReady({
      blockId,
      quote,
      top: rect.bottom + 8,
      left: Math.max(8, rect.left),
    });
  };

  if (!body.trim()) return null;

  return (
    <div
      data-block-id={blockId}
      className={cn("select-text scroll-mt-24", revisionItems.length > 0 && "relative")}
      onMouseUp={handleMouseUp}
    >
      <MarkdownContent content={body} />
      <RevisionBlockMarker
        items={revisionItems}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        onRemoveIntent={onRemoveIntent}
      />
    </div>
  );
}

function PreviewScriptSegments({
  segments,
  revisionByBlock,
  expandedBlockId,
  onExpandedBlockIdChange,
  onRemoveRevisionIntent,
  onSelectionReady,
}: {
  segments: ScriptSegment[];
  revisionByBlock: Map<string, RevisionIntent[]>;
  expandedBlockId: string | null;
  onExpandedBlockIdChange: (blockId: string | null) => void;
  onRemoveRevisionIntent?: (intentId: string) => void;
  onSelectionReady?: (selection: SelectionToolbarState | null) => void;
}) {
  return (
    <div className="space-y-4">
      {segments.map((segment) => (
        <div key={segment.id} className="space-y-1">
          {segment.label?.trim() ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {segment.label.trim()}
            </p>
          ) : null}
          <PreviewTextBlock
            body={segment.body}
            blockId={segment.id}
            revisionItems={revisionByBlock.get(segment.id) ?? []}
            expanded={expandedBlockId === segment.id}
            onExpandedChange={(open) =>
              onExpandedBlockIdChange(open ? segment.id : null)
            }
            onRemoveIntent={onRemoveRevisionIntent}
            onSelectionReady={onSelectionReady}
          />
        </div>
      ))}
    </div>
  );
}

function PreviewSelectionToolbar({
  selection,
  onAddToChat,
  onDismiss,
}: {
  selection: SelectionToolbarState;
  onAddToChat: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const handlePointerDown = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        target instanceof Element &&
        target.closest("[data-preview-selection-toolbar]")
      ) {
        return;
      }
      onDismiss();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [onDismiss]);

  return createPortal(
    <div
      data-preview-selection-toolbar
      className="fixed z-50 rounded-md border border-border/80 bg-card/95 p-0.5 shadow-md backdrop-blur-sm"
      style={{ top: selection.top, left: selection.left }}
    >
      <Button
        type="button"
        variant="outline"
        className="h-6 border-0 bg-background px-2 text-[11px] font-normal text-foreground shadow-none hover:bg-muted/60"
        onClick={onAddToChat}
      >
        {CHAT_COPY.previewSelection.addToChat}
      </Button>
    </div>,
    document.body,
  );
}

export function PreviewContentList({
  preview,
  compact = false,
  galleryKey,
  showImagePrompts = false,
  enablePreviewSelection = false,
  excludeImageIds,
  revision,
  onRemoveRevisionIntent,
  expandedBlockId = null,
  onExpandedBlockIdChange,
}: {
  preview: WorkPreview;
  compact?: boolean;
  galleryKey?: string;
  showImagePrompts?: boolean;
  enablePreviewSelection?: boolean;
  excludeImageIds?: string[];
  revision?: WorkRevision | null;
  onRemoveRevisionIntent?: (intentId: string) => void;
  expandedBlockId?: string | null;
  onExpandedBlockIdChange?: (blockId: string | null) => void;
}) {
  const previewSelections = useOptionalComposerPreviewSelectionsContext();
  const canSelect = enablePreviewSelection && previewSelections != null;
  const [pendingSelection, setPendingSelection] =
    useState<SelectionToolbarState | null>(null);

  const revisionByBlock = useMemo(
    () => groupRevisionItemsByBlock(revision).byBlock,
    [revision],
  );
  const hasRevisionMarkers = openRevisionItems(revision).some((item) =>
    Boolean(item.anchor?.blockId?.trim()),
  );

  const scriptSegments = useMemo(
    () => previewScriptSegments(preview),
    [preview],
  );
  const body = previewPlainText(preview);
  const excludedIds = useMemo(
    () => new Set(excludeImageIds?.filter(Boolean) ?? []),
    [excludeImageIds],
  );
  const images = useMemo(
    () => previewImages(preview).filter((image) => !excludedIds.has(image.id)),
    [preview, excludedIds],
  );
  const imageItems = useMemo(
    () =>
      images.map((image, index) => ({
        url: image.url,
        alt: image.alt ?? `配图 ${index + 1}`,
        prompt: image.prompt ?? null,
      })),
    [images],
  );
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const handleAddToChat = () => {
    if (!pendingSelection || !previewSelections) return;
    previewSelections.add({
      blockId: pendingSelection.blockId,
      quote: pendingSelection.quote,
    });
    window.getSelection()?.removeAllRanges();
    setPendingSelection(null);
    document
      .querySelector<HTMLTextAreaElement>(
        "[data-yougan-composer-textarea]",
      )
      ?.focus();
  };

  const setExpandedBlockId = useCallback(
    (blockId: string | null) => {
      onExpandedBlockIdChange?.(blockId);
    },
    [onExpandedBlockIdChange],
  );

  return (
    <>
      <div className={cn("space-y-4", hasRevisionMarkers && "space-y-5")}>
        {images.map((image, index) => (
          <PreviewImageFigure
            key={image.id}
            image={{
              url: image.url,
              alt: image.alt,
              prompt: showImagePrompts ? image.prompt : null,
            }}
            index={index}
            compact={compact}
            onOpenGallery={setGalleryIndex}
          />
        ))}

        {scriptSegments.length > 0 ? (
          <PreviewScriptSegments
            segments={scriptSegments}
            revisionByBlock={revisionByBlock}
            expandedBlockId={expandedBlockId}
            onExpandedBlockIdChange={setExpandedBlockId}
            onRemoveRevisionIntent={onRemoveRevisionIntent}
            onSelectionReady={canSelect ? setPendingSelection : undefined}
          />
        ) : (
          <PreviewTextBlock
            body={body}
            blockId={PREVIEW_BODY_BLOCK_ID}
            revisionItems={revisionByBlock.get(PREVIEW_BODY_BLOCK_ID) ?? []}
            expanded={expandedBlockId === PREVIEW_BODY_BLOCK_ID}
            onExpandedChange={(open) =>
              setExpandedBlockId(open ? PREVIEW_BODY_BLOCK_ID : null)
            }
            onRemoveIntent={onRemoveRevisionIntent}
            onSelectionReady={canSelect ? setPendingSelection : undefined}
          />
        )}
      </div>

      {pendingSelection && canSelect ? (
        <PreviewSelectionToolbar
          selection={pendingSelection}
          onAddToChat={handleAddToChat}
          onDismiss={() => {
            setPendingSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      ) : null}

      {imageItems.length > 0 ? (
        <PreviewImageGallery
          key={galleryKey}
          images={imageItems}
          openIndex={galleryIndex}
          onOpenIndexChange={setGalleryIndex}
        />
      ) : null}
    </>
  );
}

export function publicationPlainExcerpt(
  preview: WorkPreview | null | undefined,
  maxLength = 280,
): string {
  return previewPlainText(preview, maxLength);
}
