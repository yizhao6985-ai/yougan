import { inferMediaKind, type HumanAttachmentAsset } from "@yougan/domain";
import { FileIcon, ImageOffIcon, MusicIcon, VideoIcon } from "lucide-react";
import { useState } from "react";

import { REFERENCE_PANEL } from "@/lib/site-copy";
import { resolveReferenceAssetUrl } from "@/lib/reference-asset-url";
import { cn } from "@/lib/utils";

const THUMB_CLASS =
  "size-20 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted/30";

function attachmentTitle(asset: HumanAttachmentAsset, index: number): string {
  const name = asset.original_name?.trim();
  if (name) return name;
  const kind = inferMediaKind(asset.mime_type);
  return (
    REFERENCE_PANEL.typeLabels[kind] ?? REFERENCE_PANEL.fallbackTitle(index + 1)
  );
}

function HumanImageThumb({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          THUMB_CLASS,
          "flex flex-col items-center justify-center gap-1 text-muted-foreground",
          className,
        )}
      >
        <ImageOffIcon className="size-4" aria-hidden />
        <span className="px-1 text-center text-[9px] leading-tight">
          {REFERENCE_PANEL.imageUnavailable}
        </span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        THUMB_CLASS,
        "block transition hover:border-primary/30 hover:ring-2 hover:ring-primary/10",
        className,
      )}
      aria-label={REFERENCE_PANEL.openImage}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </a>
  );
}

function HumanMediaThumb({
  url,
  title,
  mediaKind,
  className,
}: {
  url: string;
  title: string;
  mediaKind: "audio" | "video" | "text" | "file";
  className?: string;
}) {
  const label =
    mediaKind === "audio"
      ? REFERENCE_PANEL.openAudio
      : mediaKind === "video"
        ? REFERENCE_PANEL.openVideo
        : REFERENCE_PANEL.openLink;
  const Icon =
    mediaKind === "audio"
      ? MusicIcon
      : mediaKind === "video"
        ? VideoIcon
        : FileIcon;

  if (mediaKind === "video") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          THUMB_CLASS,
          "relative block transition hover:border-primary/30 hover:ring-2 hover:ring-primary/10",
          className,
        )}
        aria-label={label}
      >
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="size-full object-cover"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/20">
          <VideoIcon className="size-5 text-foreground/80" aria-hidden />
        </span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        THUMB_CLASS,
        "flex flex-col items-center justify-center gap-1 bg-muted/40 px-1 text-muted-foreground transition hover:border-primary/30 hover:text-foreground",
        className,
      )}
      aria-label={label}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="line-clamp-2 w-full text-center text-[9px] leading-tight">
        {title}
      </span>
    </a>
  );
}

function HumanAttachmentThumb({
  asset,
  index,
}: {
  asset: HumanAttachmentAsset;
  index: number;
}) {
  const resolvedUrl = resolveReferenceAssetUrl(asset.url);
  if (!resolvedUrl) return null;

  const title = attachmentTitle(asset, index);
  const mediaKind = inferMediaKind(asset.mime_type);

  if (mediaKind === "image") {
    return <HumanImageThumb url={resolvedUrl} alt={title} />;
  }

  return (
    <HumanMediaThumb
      url={resolvedUrl}
      title={title}
      mediaKind={mediaKind}
    />
  );
}

export function HumanMessageAttachments({
  items,
  className,
}: {
  items: HumanAttachmentAsset[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((asset, index) => (
        <HumanAttachmentThumb
          key={`${asset.url}-${index}`}
          asset={asset}
          index={index}
        />
      ))}
    </div>
  );
}
