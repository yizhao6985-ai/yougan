import { Link } from "react-router-dom";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { authorDisplayName } from "@/lib/publication-utils";
import {
  formatLabel,
  mediaTypeLabel,
  topicCategoryLabel,
} from "@/lib/discover-taxonomy";
import { formatPublishedAt, platformLabel } from "@/lib/platform-labels";
import type { Publication } from "@/lib/publication-types";
import { cn } from "@/lib/utils";

function DiscoverBadges({
  publication,
  className,
}: {
  publication: Publication;
  className?: string;
}) {
  const badges = [
    formatLabel(publication.contentFormat),
    topicCategoryLabel(publication.topicCategory),
    mediaTypeLabel(publication.mediaType),
    publication.contentTopic,
  ].filter(Boolean);

  if (!badges.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
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
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{platformLabel(publication.platform)}</span>
        {timeLabel ? (
          <>
            <span aria-hidden className="text-muted-foreground/50">
              ·
            </span>
            <span>{timeLabel}</span>
          </>
        ) : null}
      </div>
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
  const cover =
    publication.coverUrl ||
    (publication.images?.[0] as { url?: string } | undefined)?.url;
  const timeLabel = publication.publishedAt
    ? formatPublishedAt(publication.publishedAt)
    : null;

  return (
    <article className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm shadow-border/25">
      {!hideAuthor ? (
        <div className="flex items-start gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
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
                  className="truncate text-sm font-semibold text-foreground hover:text-primary"
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
            <p className="mt-0.5 text-xs text-muted-foreground">
              {platformLabel(publication.platform)}
            </p>
            <DiscoverBadges publication={publication} className="mt-2" />
          </div>
        </div>
      ) : null}

      <Link
        to={`/content/${publication.slug}`}
        className="block px-4 py-4 transition hover:bg-muted/80 sm:px-5"
      >
        {hideAuthor ? (
          <PublicationMeta publication={publication} timeLabel={timeLabel} />
        ) : null}
        {publication.title ? (
          <h2
            className={cn(
              "font-semibold leading-snug text-foreground",
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
            <MarkdownContent content={publication.body.slice(0, 280)} />
          </div>
        )}

        {cover ? (
          <img
            src={cover}
            alt=""
            className={cn(
              "mt-4 w-full rounded-lg border border-border object-cover",
              compact ? "max-h-48" : "max-h-80",
            )}
          />
        ) : null}

        {publication.hashtags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {publication.hashtags.slice(0, 6).map((tag) => (
              <span key={tag} className="text-xs text-primary">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
    </article>
  );
}
