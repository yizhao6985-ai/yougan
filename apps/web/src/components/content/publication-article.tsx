import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { authorDisplayName } from "@/lib/publication-utils";
import {
  formatLabel,
  topicCategoryLabel,
} from "@/lib/discover-taxonomy";
import { formatPublishedAt, platformLabel } from "@/lib/platform-labels";
import type { Publication } from "@/lib/publication-types";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

function ArticleCategoryLine({
  publication,
}: {
  publication: Publication;
}) {
  const parts = [
    formatLabel(publication.contentFormat),
    topicCategoryLabel(publication.topicCategory),
    publication.contentTopic,
  ].filter(Boolean);

  if (!parts.length) return null;

  return (
    <p className={scene.articleCategory}>
      {parts.join(" · ")}
    </p>
  );
}

function ArticleByline({ publication }: { publication: Publication }) {
  const timeLabel = publication.publishedAt
    ? formatPublishedAt(publication.publishedAt)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {publication.author?.id ? (
        <Link
          to={`/user/${publication.author.id}`}
          className="inline-flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <AuthorAvatar author={publication.author} size="sm" />
          <span className="truncate text-sm font-semibold text-foreground">
            {authorDisplayName(publication.author)}
          </span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2.5">
          <AuthorAvatar author={publication.author} size="sm" />
          <span className="text-sm font-semibold text-foreground">
            {authorDisplayName(publication.author)}
          </span>
        </span>
      )}

      <span className={scene.articleByline}>
        {platformLabel(publication.platform)}
        {timeLabel ? (
          <>
            <span aria-hidden className="mx-1.5 text-muted-foreground/40">
              ·
            </span>
            <time dateTime={publication.publishedAt ?? undefined}>
              {timeLabel}
            </time>
          </>
        ) : null}
      </span>
    </div>
  );
}

function ArticleAuthorCard({ publication }: { publication: Publication }) {
  if (!publication.author) return null;

  const body = (
    <>
      <AuthorAvatar author={publication.author} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {authorDisplayName(publication.author)}
        </p>
        {publication.author.bio?.trim() ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {publication.author.bio.trim()}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            查看作者公开作品与主页
          </p>
        )}
      </div>
      {publication.author.id ? (
        <ArrowRightIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (publication.author.id) {
    return (
      <Link
        to={`/user/${publication.author.id}`}
        className={cn(
          scene.articleAuthorCard,
          "transition-colors hover:bg-secondary/55",
        )}
      >
        {body}
      </Link>
    );
  }

  return <aside className={scene.articleAuthorCard}>{body}</aside>;
}

export function PublicationArticle({
  publication,
}: {
  publication: Publication;
}) {
  const images = publication.images as Array<{ url?: string }>;

  return (
    <article className="pb-4">
      <header className={cn(scene.articleColumn, "space-y-5 sm:space-y-6")}>
        <ArticleCategoryLine publication={publication} />

        {publication.title ? (
          <h1 className={scene.articleTitle}>{publication.title}</h1>
        ) : null}

        {publication.excerpt ? (
          <p className={scene.articleDek}>{publication.excerpt}</p>
        ) : null}

        <ArticleByline publication={publication} />
      </header>

      {publication.coverUrl ? (
        <figure className={cn(scene.articleMediaColumn, "mt-10 sm:mt-12")}>
          <div className="overflow-hidden rounded-2xl bg-secondary/30">
            <img
              src={publication.coverUrl}
              alt=""
              className="aspect-[16/10] w-full object-cover sm:aspect-[2/1]"
            />
          </div>
        </figure>
      ) : null}

      <div
        className={cn(
          scene.articleColumn,
          scene.articleProse,
          publication.coverUrl ? "mt-10 sm:mt-12" : "mt-10 sm:mt-12",
        )}
      >
        <MarkdownContent content={publication.body} />
      </div>

      {images?.length ? (
        <div
          className={cn(
            scene.articleMediaColumn,
            "mt-10 grid gap-4 sm:grid-cols-2 sm:mt-12",
          )}
        >
          {images.map((image, index) =>
            image.url ? (
              <figure
                key={image.url}
                className="overflow-hidden rounded-xl bg-secondary/25"
              >
                <img
                  src={image.url}
                  alt={`配图 ${index + 1}`}
                  className="w-full object-cover"
                />
              </figure>
            ) : null,
          )}
        </div>
      ) : null}

      {publication.hashtags?.length ? (
        <div className={cn(scene.articleColumn, "mt-10 flex flex-wrap gap-2")}>
          {publication.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-primary"
            >
              #{tag.replace(/^#/, "")}
            </span>
          ))}
        </div>
      ) : null}

      <div className={cn(scene.articleColumn, "mt-12 sm:mt-14")}>
        <ArticleAuthorCard publication={publication} />
      </div>
    </article>
  );
}
