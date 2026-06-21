import { Link } from "react-router-dom";

import { DiscoverFeedCover } from "@/components/content/discover-publication-cover";
import { publicationCoverFromBlocks } from "@/components/preview-block-list";
import { AuthorAvatar } from "@/components/content/author-avatar";
import { authorDisplayName } from "@/lib/publication-utils";
import { topicCategoryLabel } from "@yougan/domain";
import { formatPublishedAt } from "@/lib/platform-labels";
import { publicationContentPath } from "@/lib/publication-path";
import type { Publication } from "@/lib/publication-types";
import { cn } from "@/lib/utils";

export function DiscoverFeedCard({
  publication,
  featured = false,
}: {
  publication: Publication;
  featured?: boolean;
}) {
  const coverUrl =
    publication.coverUrl ||
    publicationCoverFromBlocks(publication.blocks) ||
    null;
  const topic = topicCategoryLabel(publication.topicCategory);
  const timeLabel = publication.publishedAt
    ? formatPublishedAt(publication.publishedAt)
    : null;

  return (
    <Link
      to={publicationContentPath(publication.slug)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl bg-card transition-shadow duration-300",
        featured
          ? "ring-1 ring-primary/20 hover:shadow-md hover:shadow-primary/5"
          : "ring-1 ring-border/60 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20",
      )}
    >
      <div className="relative">
        <DiscoverFeedCover coverUrl={coverUrl} className="rounded-none" />
        {featured ? (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-foreground/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-background">
            精选
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {topic ? (
          <span className="text-[11px] font-medium text-primary/90">
            {topic}
          </span>
        ) : null}

        {publication.title ? (
          <h3
            className={cn(
              "line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary",
              featured ? "text-[17px]" : "text-base",
            )}
          >
            {publication.title}
          </h3>
        ) : null}

        {publication.excerpt ? (
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {publication.excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <AuthorAvatar author={publication.author} size="sm" />
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground/85">
              {authorDisplayName(publication.author)}
            </span>
            {timeLabel ? (
              <>
                <span className="mx-1 text-muted-foreground/35">·</span>
                {timeLabel}
              </>
            ) : null}
          </p>
        </div>
      </div>
    </Link>
  );
}
