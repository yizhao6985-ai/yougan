import { authorDisplayName } from "@/lib/publication-utils";
import type { Publication } from "@/lib/publication-types";
import { cn } from "@/lib/utils";

export function AuthorAvatar({
  author,
  size = "md",
  className,
}: {
  author?: Publication["author"];
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const name = authorDisplayName(author);
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = author?.avatarUrl?.trim();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn(
          "inline-flex shrink-0 rounded-lg object-cover bg-secondary",
          size === "sm" && "size-8",
          size === "md" && "size-10",
          size === "lg" && "size-12",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary font-medium text-primary",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-12 text-base",
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
  platform,
}: {
  author?: Publication["author"];
  publishedAt?: string | null;
  platform?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-foreground">
        {authorDisplayName(author)}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {[platform, publishedAt].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}
