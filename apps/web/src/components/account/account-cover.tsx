import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const COVER_FALLBACK_GRADIENT =
  "bg-gradient-to-r from-primary/15 via-accent/80 to-secondary/70";

const COVER_RADIAL_OVERLAY =
  "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]";

const COVER_RADIAL_OVERLAY_SOFT =
  "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]";

export function AccountCover({
  coverUrl,
  className,
  persistentOverlay = false,
}: {
  coverUrl: string | null | undefined;
  className?: string;
  /** 编辑预览等场景：封面存在时也保留轻微高光层 */
  persistentOverlay?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedUrl = coverUrl?.trim() || null;

  useEffect(() => {
    setImageFailed(false);
  }, [normalizedUrl]);

  const showFallback = !normalizedUrl || imageFailed;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        showFallback && COVER_FALLBACK_GRADIENT,
        className,
      )}
    >
      {normalizedUrl && !imageFailed ? (
        <img
          src={normalizedUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {showFallback || persistentOverlay ? (
        <div
          className={
            persistentOverlay && !showFallback
              ? COVER_RADIAL_OVERLAY_SOFT
              : COVER_RADIAL_OVERLAY
          }
        />
      ) : null}
    </div>
  );
}
