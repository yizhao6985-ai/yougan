import { useState } from "react";

import { WorkPreviewImageGallery } from "@/components/work-preview-image-gallery";
import { WorkPreviewImageFigure } from "@/components/work-preview-image-figure";
import { cn } from "@/lib/utils";

import type { WorkPreviewImageItem } from "./work-preview-images";

export type { WorkPreviewImageItem } from "./work-preview-images";

export function WorkPreviewImages({
  images,
  compact = false,
  className,
}: {
  images: WorkPreviewImageItem[];
  compact?: boolean;
  className?: string;
}) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  if (!images.length) return null;

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {images.map((image, index) => (
          <WorkPreviewImageFigure
            key={`${image.url}-${index}`}
            image={image}
            index={index}
            compact={compact}
            onOpenGallery={setGalleryIndex}
          />
        ))}
      </div>

      <WorkPreviewImageGallery
        images={images}
        openIndex={galleryIndex}
        onOpenIndexChange={setGalleryIndex}
      />
    </>
  );
}
