import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { PREVIEW_PANEL, REFERENCE_PANEL } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

import type { WorkPreviewImageItem } from "./work-preview-images";

function imageLabel(image: WorkPreviewImageItem, index: number) {
  return image.alt?.trim() || `配图 ${index + 1}`;
}

export function WorkPreviewImageGallery({
  images,
  openIndex,
  onOpenIndexChange,
}: {
  images: WorkPreviewImageItem[];
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
}) {
  const open = openIndex !== null;
  const activeIndex = openIndex ?? 0;
  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;
  const [failed, setFailed] = useState(false);

  const close = useCallback(() => {
    onOpenIndexChange(null);
  }, [onOpenIndexChange]);

  const goPrevious = useCallback(() => {
    if (activeIndex <= 0) return;
    onOpenIndexChange(activeIndex - 1);
  }, [activeIndex, onOpenIndexChange]);

  const goNext = useCallback(() => {
    if (activeIndex >= images.length - 1) return;
    onOpenIndexChange(activeIndex + 1);
  }, [activeIndex, images.length, onOpenIndexChange]);

  useEffect(() => {
    if (!open) return;
    setFailed(false);
  }, [open, activeIndex, activeImage?.url]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, goPrevious, goNext]);

  if (!activeImage) return null;

  const label = imageLabel(activeImage, activeIndex);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/92" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex flex-col outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {PREVIEW_PANEL.galleryTitle} ·{" "}
            {PREVIEW_PANEL.galleryCounter(activeIndex + 1, images.length)}
          </DialogPrimitive.Title>

          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white/90 sm:px-6">
            <p className="text-sm tabular-nums">
              {PREVIEW_PANEL.galleryCounter(activeIndex + 1, images.length)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-white/90 hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href={activeImage.url} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon className="size-4" />
                  {PREVIEW_PANEL.galleryOpenOriginal}
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-white/90 hover:bg-white/10 hover:text-white"
                onClick={close}
                aria-label="关闭图册"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 sm:px-20">
            {hasMultiple ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-white/90 hover:bg-white/10 hover:text-white disabled:opacity-30 sm:left-4"
                onClick={goPrevious}
                disabled={activeIndex <= 0}
                aria-label={PREVIEW_PANEL.galleryPrevious}
              >
                <ChevronLeftIcon className="size-6" />
              </Button>
            ) : null}

            <div className="flex max-h-full max-w-full flex-col items-center justify-center">
              {failed ? (
                <p className="px-6 text-center text-sm text-white/70">
                  {REFERENCE_PANEL.imageUnavailable}
                </p>
              ) : (
                <img
                  src={activeImage.url}
                  alt={label}
                  onError={() => setFailed(true)}
                  className="max-h-[calc(100vh-9rem)] max-w-full object-contain"
                />
              )}
              {label ? (
                <p className="mt-4 max-w-2xl px-4 text-center text-sm leading-6 text-white/75">
                  {label}
                </p>
              ) : null}
            </div>

            {hasMultiple ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-white/90 hover:bg-white/10 hover:text-white disabled:opacity-30 sm:right-4"
                onClick={goNext}
                disabled={activeIndex >= images.length - 1}
                aria-label={PREVIEW_PANEL.galleryNext}
              >
                <ChevronRightIcon className="size-6" />
              </Button>
            ) : null}
          </div>

          {hasMultiple ? (
            <div className="flex shrink-0 justify-center gap-2 px-4 pb-5 pt-2">
              {images.map((image, index) => (
                <button
                  key={`${image.url}-gallery-dot-${index}`}
                  type="button"
                  aria-label={`查看第 ${index + 1} 张配图`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => onOpenIndexChange(index)}
                  className={cn(
                    "size-2 rounded-full transition",
                    index === activeIndex
                      ? "bg-white"
                      : "bg-white/35 hover:bg-white/55",
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="h-5 shrink-0" />
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
