import { Link } from "react-router-dom";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { publicationPlainExcerpt } from "@/components/preview-content-list";
import { authorDisplayName } from "@/lib/publication-utils";
import { topicCategoryLabel } from "@yougan/domain";
import { formatPublishedAt } from "@/lib/platform-labels";
import { publicationContentPath } from "@/lib/publication-path";
import type { Publication } from "@/lib/publication-types";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

function DiscoverBadges({
  publication,
  className,
}: {
  publication: Publication;
  className?: string;
}) {
  const badges = [
    publication.compositionLabel?.trim(),
    topicCategoryLabel(publication.topicCategory),
    publication.consumptionHint?.trim(),
  ].filter(Boolean);

  if (!badges.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

function PublicationMeta({
  publication,
  timeLabel,
}: {
  publication: Publication;
  timeLabel: string | null;
}) {
  return (
    <div className="space-y-2">
      {timeLabel ? (
        <p className="text-xs text-muted-foreground">{timeLabel}</p>
      ) : null}
      <DiscoverBadges publication={publication} />
    </div>
  );
}

export function PublicationFeedPost({
  publication,
  compact = false,
  hideAuthor = false,
}: {
  publication: Publication;
  compact?: boolean;
  hideAuthor?: boolean;
}) {
  const cover = publication.coverUrl?.trim() || null;
  const timeLabel = publication.publishedAt
    ? formatPublishedAt(publication.publishedAt)
    : null;

  return (
    <article
      className={cn(
        scene.cardInteractive,
        "group overflow-hidden",
      )}
    >
      {!hideAuthor ? (
        <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
          {publication.author?.id ? (
            <Link to={`/user/${publication.author.id}`} className="shrink-0">
              <AuthorAvatar author={publication.author} size="md" />
            </Link>
          ) : (
            <AuthorAvatar author={publication.author} size="md" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {publication.author?.id ? (
                <Link
                  to={`/user/${publication.author.id}`}
                  className="truncate text-sm font-semibold text-foreground transition-colors duration-200 hover:text-primary"
                >
                  {authorDisplayName(publication.author)}
                </Link>
              ) : (
                <span className="truncate text-sm font-semibold text-foreground">
                  {authorDisplayName(publication.author)}
                </span>
              )}
              {timeLabel ? (
                <span className="text-xs text-muted-foreground/70">
                  {timeLabel}
                </span>
              ) : null}
            </div>
            <DiscoverBadges publication={publication} className="mt-2" />
          </div>
        </div>
      ) : null}

      <Link
        to={publicationContentPath(publication.slug)}
        className="block border-t border-border/50 px-4 py-4 sm:px-5"
      >
        {hideAuthor ? (
          <PublicationMeta publication={publication} timeLabel={timeLabel} />
        ) : null}
        {publication.title ? (
          <h2
            className={cn(
              "font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary",
              compact ? "text-base" : "text-lg",
              hideAuthor ? "mt-2" : undefined,
            )}
          >
            {publication.title}
          </h2>
        ) : null}

        {publication.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {publication.excerpt}
          </p>
        ) : (
          <div
            className={cn(
              "mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground",
              "[&_p]:inline [&_p]:m-0",
            )}
          >
            <MarkdownContent
              content={publicationPlainExcerpt(publication.preview, 280)}
            />
          </div>
        )}

        {cover ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70">
            <img
              src={cover}
              alt=""
              className={cn(
                "w-full object-cover transition duration-500 group-hover:scale-[1.02]",
                compact ? "max-h-48" : "max-h-80",
              )}
            />
          </div>
        ) : null}

        {publication.hashtags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {publication.hashtags.slice(0, 6).map((tag) => (
              <span key={tag} className="text-xs font-medium text-primary/90">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
    </article>
  );
}
