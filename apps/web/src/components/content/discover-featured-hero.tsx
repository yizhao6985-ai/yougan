import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { authorDisplayName } from "@/lib/publication-utils";
import {
  formatLabel,
  topicCategoryLabel,
} from "@/lib/discover-taxonomy";
import { formatPublishedAt, platformLabel } from "@/lib/platform-labels";
import { publicationContentPath } from "@/lib/publication-path";
import type { Publication } from "@/lib/publication-types";
import { DISCOVER_SECTION } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function DiscoverFeaturedHero({
  publication,
}: {
  publication: Publication;
}) {
  const cover =
    publication.coverUrl ||
    (publication.images?.[0] as { url?: string } | undefined)?.url;
  const format = formatLabel(publication.contentFormat);
  const topic = topicCategoryLabel(publication.topicCategory);

  return (
    <Link
      to={publicationContentPath(publication.slug)}
      className="group block overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/25"
    >
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <div
          className={cn(
            "relative overflow-hidden",
            cover
              ? "aspect-[16/10] lg:aspect-auto lg:min-h-[22rem]"
              : "min-h-[14rem] bg-gradient-to-br from-accent/60 via-card to-secondary/40 lg:min-h-[22rem]",
          )}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              className="size-full object-cover transition duration-700 group-hover:scale-[1.02]"
            />
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            {DISCOVER_SECTION.featuredHeading}
          </p>

          {publication.title ? (
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:text-3xl lg:text-[2rem] lg:leading-[1.15]">
              {publication.title}
            </h2>
          ) : null}

          {publication.excerpt ? (
            <p className="line-clamp-3 text-base leading-7 text-muted-foreground">
              {publication.excerpt}
            </p>
          ) : null}

          {(format || topic) && (
            <div className="flex flex-wrap gap-2">
              {format ? (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {format}
                </span>
              ) : null}
              {topic ? (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {topic}
                </span>
              ) : null}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <div className="flex min-w-0 items-center gap-3">
              <AuthorAvatar author={publication.author} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {authorDisplayName(publication.author)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {platformLabel(publication.platform)}
                  {publication.publishedAt
                    ? ` · ${formatPublishedAt(publication.publishedAt)}`
                    : ""}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              阅读
              <ArrowRightIcon className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
