import { useMemo, useState } from "react";
import type { PreviewBlock } from "@yougan/domain";
import { previewCoverUrl, previewPlainText } from "@yougan/domain";

import { MarkdownContent } from "@/components/markdown-content";
import { WorkPreviewImageGallery } from "@/components/work-preview-image-gallery";
import type { WorkPreviewImageItem } from "@/components/work-preview-images";
import { WorkPreviewImageFigure } from "@/components/work-preview-image-figure";
import { cn } from "@/lib/utils";

function blocksToImageItems(blocks: PreviewBlock[]): WorkPreviewImageItem[] {
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
    <div className="space-y-2 rounded-xl border border-border/70 bg-secondary/20 p-2">
      {block.title?.trim() ? (
        <p className="px-2 pt-2 text-sm font-medium text-foreground">
          {block.title}
        </p>
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
}: {
  blocks: PreviewBlock[];
  compact?: boolean;
  galleryKey?: string;
  showImagePrompts?: boolean;
}) {
  const imageItems = useMemo(() => blocksToImageItems(blocks), [blocks]);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  let imageCursor = 0;

  return (
    <>
      <div className="space-y-4">
        {blocks.map((block) => {
          switch (block.type) {
            case "text":
              return block.markdown.trim() ? (
                <MarkdownContent key={block.id} content={block.markdown} />
              ) : null;
            case "image": {
              const index = imageCursor;
              imageCursor += 1;
              return (
                <WorkPreviewImageFigure
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

      {imageItems.length > 0 ? (
        <WorkPreviewImageGallery
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
