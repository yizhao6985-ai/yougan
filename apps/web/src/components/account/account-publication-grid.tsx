import { Link } from "react-router-dom";

import { MarkdownContent } from "@/components/markdown-content";
import {
  publicationCoverFromBlocks,
  publicationPlainExcerpt,
} from "@/components/preview-block-list";
import {
  formatLabel,
  topicCategoryLabel,
} from "@/lib/discover-taxonomy";
import { formatPublishedAt, platformLabel } from "@/lib/platform-labels";
import { publicationContentPath } from "@/lib/publication-path";
import type { Publication } from "@/lib/publication-types";
import { cn } from "@/lib/utils";

export function AccountPublicationCard({
  publication,
}: {
  publication: Publication;
}) {
  const cover =
    publication.coverUrl || publicationCoverFromBlocks(publication.blocks);
  const timeLabel = publication.publishedAt
    ? formatPublishedAt(publication.publishedAt)
    : null;
  const badges = [
    formatLabel(publication.contentFormat),
    topicCategoryLabel(publication.topicCategory),
  ].filter(Boolean);

  return (
    <Link
      to={publicationContentPath(publication.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm shadow-border/20 transition hover:border-primary/20 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary/40">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-6">
            <p className="line-clamp-4 text-center text-sm leading-6 text-muted-foreground">
              {publication.excerpt?.trim() ||
                publicationPlainExcerpt(publication.blocks, 120)}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{platformLabel(publication.platform)}</span>
          {timeLabel ? (
            <>
              <span aria-hidden>·</span>
              <span>{timeLabel}</span>
            </>
          ) : null}
        </div>

        <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-lg">
          {publication.title}
        </h2>

        {publication.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {publication.excerpt}
          </p>
        ) : (
          <div
            className={cn(
              "mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground",
              "[&_p]:inline [&_p]:m-0",
            )}
          >
            <MarkdownContent
              content={publicationPlainExcerpt(publication.blocks, 160)}
            />
          </div>
        )}

        {badges.length ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function AccountPublicationGrid({
  publications,
}: {
  publications: Publication[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {publications.map((publication) => (
        <AccountPublicationCard
          key={publication.id}
          publication={publication}
        />
      ))}
    </div>
  );
}
