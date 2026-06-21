import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { PreviewBlock, RevisionIntent, WorkRevision } from "@yougan/domain";
import { openRevisionItems, previewCoverUrl, previewPlainText } from "@yougan/domain";

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

function blocksToImageItems(blocks: PreviewBlock[]): PreviewImageItem[] {
  return blocks
    .filter((block): block is Extract<PreviewBlock, { type: "image" }> =>
      block.type === "image",
    )
    .map((block, index) => ({
      url: block.url,
      alt: block.alt ?? `配图 ${index + 1}`,
      prompt: block.prompt ?? null,
    }));
}

type SelectionToolbarState = {
  blockId: string;
  quote: string;
  top: number;
  left: number;
};

function PreviewTextBlock({
  block,
  revisionItems,
  expanded,
  onExpandedChange,
  onRemoveIntent,
  onSelectionReady,
}: {
  block: Extract<PreviewBlock, { type: "text" }>;
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
      blockId: block.id,
      quote,
      top: rect.bottom + 8,
      left: Math.max(8, rect.left),
    });
  };

  if (!block.markdown.trim()) return null;

  return (
    <div
      data-block-id={block.id}
      className={cn("select-text scroll-mt-24", revisionItems.length > 0 && "relative")}
      onMouseUp={handleMouseUp}
    >
      <MarkdownContent content={block.markdown} />
      <RevisionBlockMarker
        items={revisionItems}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        onRemoveIntent={onRemoveIntent}
      />
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

function PreviewAudioBlock({
  block,
}: {
  block: Extract<PreviewBlock, { type: "audio" }>;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-secondary/20 p-4">
      {block.title?.trim() ? (
        <p className="text-sm font-medium text-foreground">{block.title}</p>
      ) : null}
      <audio controls className="w-full" src={block.url}>
        您的浏览器不支持音频播放。
      </audio>
      {block.transcript?.trim() ? (
        <p className="text-sm leading-6 text-muted-foreground">
          {block.transcript.trim()}
        </p>
      ) : null}
    </div>
  );
}

function PreviewVideoBlock({
  block,
}: {
  block: Extract<PreviewBlock, { type: "video" }>;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-secondary/20 p-4">
      {block.title?.trim() ? (
        <p className="text-sm font-medium text-foreground">{block.title}</p>
      ) : null}
      <video
        controls
        className="w-full rounded-lg"
        src={block.url}
        poster={block.posterUrl ?? undefined}
      >
        您的浏览器不支持视频播放。
      </video>
    </div>
  );
}

export function PreviewBlockList({
  blocks,
  compact = false,
  galleryKey,
  showImagePrompts = false,
  enablePreviewSelection = false,
  revision,
  onRemoveRevisionIntent,
  expandedBlockId = null,
  onExpandedBlockIdChange,
}: {
  blocks: PreviewBlock[];
  compact?: boolean;
  galleryKey?: string;
  showImagePrompts?: boolean;
  enablePreviewSelection?: boolean;
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

  const imageItems = useMemo(() => blocksToImageItems(blocks), [blocks]);
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

  let imageCursor = 0;

  return (
    <>
      <div className={cn("space-y-4", hasRevisionMarkers && "space-y-5")}>
        {blocks.map((block) => {
          switch (block.type) {
            case "text":
              return (
                <PreviewTextBlock
                  key={block.id}
                  block={block}
                  revisionItems={revisionByBlock.get(block.id) ?? []}
                  expanded={expandedBlockId === block.id}
                  onExpandedChange={(open) =>
                    setExpandedBlockId(open ? block.id : null)
                  }
                  onRemoveIntent={onRemoveRevisionIntent}
                  onSelectionReady={
                    canSelect ? setPendingSelection : undefined
                  }
                />
              );
            case "image": {
              const index = imageCursor;
              imageCursor += 1;
              return (
                <PreviewImageFigure
                  key={block.id}
                  image={{
                    url: block.url,
                    alt: block.alt,
                    prompt: showImagePrompts ? block.prompt : null,
                  }}
                  index={index}
                  compact={compact}
                  onOpenGallery={setGalleryIndex}
                />
              );
            }
            case "audio":
              return <PreviewAudioBlock key={block.id} block={block} />;
            case "video":
              return <PreviewVideoBlock key={block.id} block={block} />;
            default:
              return null;
          }
        })}
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

export function publicationCoverFromBlocks(blocks: PreviewBlock[]): string | null {
  return previewCoverUrl({ blocks });
}

export function publicationPlainExcerpt(
  blocks: PreviewBlock[],
  maxLength = 280,
): string {
  return previewPlainText({ blocks }, maxLength);
}
