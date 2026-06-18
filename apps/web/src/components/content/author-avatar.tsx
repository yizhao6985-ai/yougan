import { useEffect, useState } from "react";

import { authorDisplayName } from "@/lib/publication-utils";
import type { Publication } from "@/lib/publication-types";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: { box: "size-8", text: "text-xs" },
  md: { box: "size-10", text: "text-sm" },
  lg: { box: "size-12", text: "text-base" },
} as const;

export function AuthorAvatar({
  author,
  size = "md",
  className,
}: {
  author?: Publication["author"];
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = authorDisplayName(author);
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = author?.avatarUrl?.trim() || null;

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const showFallback = !avatarUrl || imageFailed;
  const { box, text } = sizeClasses[size];

  if (!showFallback) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn(
          "inline-flex shrink-0 rounded-lg object-cover bg-secondary",
          box,
          className,
        )}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary font-medium text-primary",
        box,
        text,
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function AuthorMeta({
  author,
  publishedAt,
}: {
  author?: Publication["author"];
  publishedAt?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-foreground">
        {authorDisplayName(author)}
      </p>
      {publishedAt ? (
        <p className="truncate text-xs text-muted-foreground">{publishedAt}</p>
      ) : null}
    </div>
  );
}
