import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { PublicationDetailCover } from "@/components/content/publication-detail-cover";
import { PreviewContentList } from "@/components/preview-content-list";
import { authorDisplayName } from "@/lib/publication-utils";
import { topicCategoryLabel } from "@yougan/domain";
import { formatPublishedAt } from "@/lib/platform-labels";
import type { Publication } from "@/lib/publication-types";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

function ArticleCategoryLine({
  publication,
}: {
  publication: Publication;
}) {
  const parts = [
    publication.compositionLabel?.trim(),
    topicCategoryLabel(publication.topicCategory),
  ].filter(Boolean);
  const categoryText = parts.join(" · ");

  return (
    <p
      className={cn(scene.articleCategory, !categoryText && "invisible")}
      aria-hidden={!categoryText}
    >
      {categoryText || "占位"}
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
        {timeLabel ? (
          <time dateTime={publication.publishedAt ?? undefined}>
            {timeLabel}
          </time>
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
  return (
    <article className="space-y-10 pb-4 sm:space-y-12">
      <PublicationDetailCover coverUrl={publication.coverUrl} />

      <header className="space-y-5 sm:space-y-6">
        <ArticleCategoryLine publication={publication} />

        {publication.title ? (
          <h1 className={scene.articleTitle}>{publication.title}</h1>
        ) : null}

        {publication.excerpt ? (
          <p className={scene.articleDek}>{publication.excerpt}</p>
        ) : null}

        <ArticleByline publication={publication} />
      </header>

      <div className={scene.articleProse}>
        <PreviewContentList
          preview={publication.preview}
          galleryKey={publication.slug}
          excludeImageIds={
            publication.coverImageId ? [publication.coverImageId] : undefined
          }
        />
      </div>

      {publication.hashtags?.length ? (
        <div className="flex flex-wrap gap-2">
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

      <ArticleAuthorCard publication={publication} />
    </article>
  );
}
