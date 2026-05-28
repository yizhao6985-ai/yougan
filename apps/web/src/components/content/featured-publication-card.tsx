import { Link } from "react-router-dom";
import { SparklesIcon } from "lucide-react";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { authorDisplayName } from "@/lib/publication-utils";
import { formatLabel, topicCategoryLabel } from "@/lib/discover-taxonomy";
import { formatPublishedAt, platformLabel } from "@/lib/platform-labels";
import type { Publication } from "@/lib/publication-types";

export function pickFeaturedPublications(
  publications: Publication[],
  limit = 2,
) {
  if (publications.length === 0) {
    return { featured: [] as Publication[], rest: [] as Publication[] };
  }

  const withVisual = publications.filter(
    (item) =>
      item.coverUrl ||
      (item.images?.length ?? 0) > 0 ||
      (item.excerpt?.trim().length ?? 0) > 40,
  );
  const pool = withVisual.length > 0 ? withVisual : publications;
  const featured = pool.slice(0, Math.min(limit, pool.length));
  const featuredIds = new Set(featured.map((item) => item.id));

  return {
    featured,
    rest: publications.filter((item) => !featuredIds.has(item.id)),
  };
}

export function FeaturedPublicationCard({
  publication,
}: {
  publication: Publication;
}) {
  const cover =
    publication.coverUrl ||
    (publication.images?.[0] as { url?: string } | undefined)?.url;

  return (
    <Link
      to={`/content/${publication.slug}`}
      className="group block overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/55 via-card to-secondary/35 shadow-sm shadow-primary/10 transition hover:border-primary/25 hover:shadow-md"
    >
      {cover ? (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium text-primary shadow-sm">
            <SparklesIcon className="size-3.5" />
            精选
          </span>
        </div>
      ) : null}

      <div className="space-y-3 p-5 sm:p-6">
        {!cover ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
            <SparklesIcon className="size-3.5" />
            精选
          </span>
        ) : null}

        <div className="flex items-center gap-3">
          <AuthorAvatar author={publication.author} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
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

        <div>
          <h2 className="text-xl font-semibold leading-snug text-foreground group-hover:text-primary">
            {publication.title}
          </h2>
          {publication.excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {publication.excerpt}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {formatLabel(publication.contentFormat) ? (
            <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border/80">
              {formatLabel(publication.contentFormat)}
            </span>
          ) : null}
          {topicCategoryLabel(publication.topicCategory) ? (
            <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border/80">
              {topicCategoryLabel(publication.topicCategory)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
