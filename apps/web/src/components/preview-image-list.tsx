import { useState } from "react";

import { PreviewImageGallery } from "@/components/preview-image-gallery";
import { PreviewImageFigure } from "@/components/preview-image-figure";
import { cn } from "@/lib/utils";

/** 预览展示用配图项（来自 PreviewImage，不含元数据） */
export type PreviewImageItem = {
  url: string;
  alt?: string | null;
  prompt?: string | null;
};

export function PreviewImageList({
  images,
  compact = false,
  className,
}: {
  images: PreviewImageItem[];
  compact?: boolean;
  className?: string;
}) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  if (!images.length) return null;

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {images.map((image, index) => (
          <PreviewImageFigure
            key={`${image.url}-${index}`}
            image={image}
            index={index}
            compact={compact}
            onOpenGallery={setGalleryIndex}
          />
        ))}
      </div>

      <PreviewImageGallery
        images={images}
        openIndex={galleryIndex}
        onOpenIndexChange={setGalleryIndex}
      />
    </>
  );
}
