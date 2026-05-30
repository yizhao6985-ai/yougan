import { ExternalLinkIcon, ImageOffIcon } from "lucide-react";
import { useState } from "react";

import { CreativeContextInset } from "@/components/studio/creative-context/shared";
import { REFERENCE_PANEL } from "@/lib/site-copy";
import { resolveReferenceAssetUrl } from "@/lib/reference-asset-url";
import type { ReferenceItem } from "@/lib/types";
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

function ReferenceWebPreview({
  url,
  title,
}: {
  url: string;
  title?: string | null;
}) {
  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // keep raw url
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 transition hover:border-primary/25 hover:bg-muted/50"
    >
      <ExternalLinkIcon
        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="line-clamp-2 text-sm font-medium text-foreground">
            {title}
          </p>
        ) : null}
        <p
          className={cn(
            "truncate text-xs text-primary",
            title ? "mt-0.5" : undefined,
          )}
        >
          {hostname}
        </p>
      </div>
    </a>
  );
}

export function ReferenceImageMedia({
  item,
  title,
  className,
}: {
  item: ReferenceItem;
  title: string;
  className?: string;
}) {
  if (item.source_type !== "image" || !item.image_url) return null;
  const resolvedUrl = resolveReferenceAssetUrl(item.image_url);
  if (!resolvedUrl) return null;
  return (
    <ReferenceImageThumb url={resolvedUrl} alt={title} className={className} />
  );
}

export function ReferenceMedia({
  item,
}: {
  item: ReferenceItem;
  title: string;
}) {
  if (item.source_type === "image") {
    return null;
  }

  if (item.source_type === "text" && item.raw_excerpt?.trim()) {
    return (
      <CreativeContextInset className="text-xs leading-5 text-muted-foreground">
        {item.raw_excerpt.trim()}
      </CreativeContextInset>
    );
  }

  if (item.source_type === "web" && item.url) {
    return <ReferenceWebPreview url={item.url} title={item.title} />;
  }

  return null;
}
