import {
  inferMediaKind,
  referenceAssetUrl,
  type WorkReference,
} from "@yougan/domain";
import { ImageOffIcon, MusicIcon, VideoIcon } from "lucide-react";
import { useState } from "react";

import { CreativeContextInset } from "@/components/studio/creative-context/shared";
import { REFERENCE_PANEL } from "@/lib/site-copy";
import { resolveReferenceAssetUrl } from "@/lib/reference-asset-url";
import { cn } from "@/lib/utils";

const THUMB_CLASS =
  "size-16 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted/30";

function ReferenceImageThumb({
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
        "group/thumb block transition hover:border-primary/30 hover:ring-2 hover:ring-primary/10",
        className,
      )}
      aria-label={REFERENCE_PANEL.openImage}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover transition duration-200 group-hover/thumb:scale-105"
      />
    </a>
  );
}

function ReferenceMediaThumb({
  url,
  title,
  mediaKind,
  className,
}: {
  url: string;
  title: string;
  mediaKind: "audio" | "video" | "file";
  className?: string;
}) {
  const label =
    mediaKind === "audio"
      ? REFERENCE_PANEL.openAudio
      : mediaKind === "video"
        ? REFERENCE_PANEL.openVideo
        : REFERENCE_PANEL.openLink;
  const Icon = mediaKind === "audio" ? MusicIcon : VideoIcon;

  if (mediaKind === "video") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          THUMB_CLASS,
          "group/thumb relative block transition hover:border-primary/30 hover:ring-2 hover:ring-primary/10",
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

export function ReferenceImageMedia({
  item,
  title,
  className,
}: {
  item: WorkReference;
  title: string;
  className?: string;
}) {
  const assetUrl = referenceAssetUrl(item);
  if (!assetUrl) return null;
  const resolvedUrl = resolveReferenceAssetUrl(assetUrl);
  if (!resolvedUrl) return null;
  return (
    <ReferenceImageThumb url={resolvedUrl} alt={title} className={className} />
  );
}

export function ReferenceAssetMedia({
  item,
  title,
  className,
}: {
  item: WorkReference;
  title: string;
  className?: string;
}) {
  const assetUrl = referenceAssetUrl(item);
  if (!assetUrl) return null;
  const resolvedUrl = resolveReferenceAssetUrl(assetUrl);
  if (!resolvedUrl || item.content.kind !== "asset") return null;

  const mediaKind = inferMediaKind(item.content.asset.mime_type);
  if (mediaKind === "image") {
    return (
      <ReferenceImageThumb url={resolvedUrl} alt={title} className={className} />
    );
  }

  if (mediaKind === "audio" || mediaKind === "video") {
    return (
      <ReferenceMediaThumb
        url={resolvedUrl}
        title={title}
        mediaKind={mediaKind}
        className={className}
      />
    );
  }

  return (
    <ReferenceMediaThumb
      url={resolvedUrl}
      title={title}
      mediaKind="file"
      className={className}
    />
  );
}

export function ReferenceMedia({
  item,
}: {
  item: WorkReference;
  title: string;
}) {
  if (item.content.kind === "asset") {
    return null;
  }

  const excerpt = item.content.text.trim();
  if (!excerpt) return null;

  return (
    <CreativeContextInset className="text-xs leading-5 text-muted-foreground">
      {excerpt.length > 280 ? `${excerpt.slice(0, 280)}…` : excerpt}
    </CreativeContextInset>
  );
}
