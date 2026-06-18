import { ChevronDownIcon, ImageOffIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

import { PREVIEW_PANEL, REFERENCE_PANEL } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

import type { WorkPreviewImageItem } from "./work-preview-images";

function WorkPreviewImagePrompt({ prompt }: { prompt: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-border/60">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
      >
        <SparklesIcon className="size-3" aria-hidden />
        {expanded ? PREVIEW_PANEL.promptHide : PREVIEW_PANEL.promptShow}
        <ChevronDownIcon
          className={cn(
            "ml-auto size-3 transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {expanded ? (
        <p className="whitespace-pre-wrap break-words px-3 pb-3 text-xs leading-5 text-muted-foreground/90">
          {prompt}
        </p>
      ) : null}
    </div>
  );
}

export function WorkPreviewImageFigure({
  image,
  index,
  compact,
  onOpenGallery,
}: {
  image: WorkPreviewImageItem;
  index: number;
  compact?: boolean;
  onOpenGallery: (index: number) => void;
}) {
  const [failed, setFailed] = useState(false);
  const alt = image.alt?.trim() || `配图 ${index + 1}`;
  const caption = image.alt?.trim();
  const prompt = image.prompt?.trim();

  if (failed) {
    return (
      <figure className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-muted-foreground">
        <ImageOffIcon className="size-5" aria-hidden />
        <figcaption className="text-center text-xs">
          {REFERENCE_PANEL.imageUnavailable}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-lg border border-border/80 bg-muted/20">
      <button
        type="button"
        onClick={() => onOpenGallery(index)}
        className="group relative block w-full cursor-zoom-in transition hover:bg-muted/30"
        aria-label={PREVIEW_PANEL.openGallery}
      >
        <img
          src={image.url}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn(
            "mx-auto w-full object-contain transition duration-200 group-hover:opacity-95",
            compact ? "max-h-80" : "max-h-[min(70vh,560px)]",
          )}
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-3 py-2 text-left text-[11px] text-white/90 opacity-0 transition group-hover:opacity-100">
          {PREVIEW_PANEL.openGallery}
        </span>
      </button>
      {caption ? (
        <figcaption className="border-t border-border/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
      {prompt ? <WorkPreviewImagePrompt prompt={prompt} /> : null}
    </figure>
  );
}
