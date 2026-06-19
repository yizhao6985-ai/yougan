import { Link } from "react-router-dom";

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
}: {
  publication: Publication;
}) {
  const cover =
    publication.coverUrl || publicationCoverFromBlocks(publication.blocks);
  const compositionLabel = publication.compositionLabel?.trim();
  const topic = topicCategoryLabel(publication.topicCategory);
  const timeLabel = publication.publishedAt
    ? formatPublishedAt(publication.publishedAt)
    : null;

  return (
    <Link
      to={publicationContentPath(publication.slug)}
      className="group flex h-full flex-col gap-3"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-secondary/50",
          cover ? "aspect-[4/3]" : "aspect-[4/3] bg-gradient-to-br from-accent/50 via-card to-secondary/40",
        )}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-0.5">
        {(compositionLabel || topic) && (
          <div className="flex flex-wrap gap-1.5">
            {compositionLabel ? (
              <span className="text-xs font-medium text-primary/90">
                {compositionLabel}
              </span>
            ) : null}
            {compositionLabel && topic ? (
              <span className="text-xs text-muted-foreground/50">·</span>
            ) : null}
            {topic ? (
              <span className="text-xs text-muted-foreground">{topic}</span>
            ) : null}
          </div>
        )}

        {publication.title ? (
          <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
            {publication.title}
          </h3>
        ) : null}

        {publication.excerpt ? (
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {publication.excerpt}
          </p>
        ) : null}

        {publication.consumptionHint ? (
          <p className="text-xs text-muted-foreground/80">
            {publication.consumptionHint}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <AuthorAvatar author={publication.author} size="sm" />
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground/90">
              {authorDisplayName(publication.author)}
            </span>
            {timeLabel ? (
              <>
                <span className="mx-1 text-muted-foreground/40">·</span>
                {timeLabel}
              </>
            ) : null}
          </p>
        </div>
      </div>
    </Link>
  );
}
