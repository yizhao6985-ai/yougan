import { Link } from "react-router-dom";

import { AuthorAvatar } from "@/components/content/author-avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { authorDisplayName } from "@/lib/publication-utils";
import {
  formatLabel,
  topicCategoryLabel,
} from "@/lib/discover-taxonomy";
import { formatPublishedAt, platformLabel } from "@/lib/platform-labels";
import type { Publication } from "@/lib/publication-types";

export function PublicationArticle({
  publication,
}: {
  publication: Publication;
}) {
  const images = publication.images as Array<{ url?: string }>;

  return (
    <article className="space-y-6">
      <header className="flex items-start gap-3 border-b border-border/80 pb-6">
        {publication.author?.id ? (
          <Link to={`/user/${publication.author.id}`} className="shrink-0">
            <AuthorAvatar author={publication.author} size="lg" />
          </Link>
        ) : (
          <AuthorAvatar author={publication.author} size="lg" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          {publication.author?.id ? (
            <Link
              to={`/user/${publication.author.id}`}
              className="text-base font-semibold text-foreground hover:text-primary"
            >
              {authorDisplayName(publication.author)}
            </Link>
          ) : (
            <p className="text-base font-semibold text-foreground">
              {authorDisplayName(publication.author)}
            </p>
          )}
          {publication.author?.bio?.trim() ? (
            <p className="text-sm text-muted-foreground">
              {publication.author.bio.trim()}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-primary">
              {platformLabel(publication.platform)}
            </span>
            {formatLabel(publication.contentFormat) ? (
              <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground/90">
                {formatLabel(publication.contentFormat)}
              </span>
            ) : null}
            {topicCategoryLabel(publication.topicCategory) ? (
              <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground/90">
                {topicCategoryLabel(publication.topicCategory)}
              </span>
            ) : null}
            {publication.contentTopic ? (
              <span className="text-xs text-muted-foreground">
                主题：{publication.contentTopic}
              </span>
            ) : null}
            {publication.publishedAt ? (
              <span>{formatPublishedAt(publication.publishedAt)}</span>
            ) : null}
          </div>
        </div>
      </header>

      {publication.title ? (
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {publication.title}
        </h1>
      ) : null}

      {publication.excerpt ? (
        <p className="text-lg leading-8 text-muted-foreground">{publication.excerpt}</p>
      ) : null}

      {publication.coverUrl ? (
        <img
          src={publication.coverUrl}
          alt=""
          className="w-full rounded-lg border border-border object-cover"
        />
      ) : null}

      <div className="prose prose-stone max-w-none">
        <MarkdownContent content={publication.body} />
      </div>

      {images?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) =>
            image.url ? (
              <img
                key={image.url}
                src={image.url}
                alt={`配图 ${index + 1}`}
                className="w-full rounded-lg border border-border"
              />
            ) : null,
          )}
        </div>
      ) : null}

      {publication.hashtags?.length ? (
        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-6">
          {publication.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-accent px-2.5 py-1 text-xs text-primary"
            >
              #{tag.replace(/^#/, "")}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
