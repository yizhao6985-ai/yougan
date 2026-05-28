const PREFIX = "yougan";

export type FeedCacheQuery = {
  platform?: string;
  contentFormat?: string;
  topicCategory?: string;
  mediaType?: string;
  limit?: number;
};

export const cacheKeys = {
  publicationFeed(query: FeedCacheQuery) {
    const normalized = [
      query.platform ?? "",
      query.contentFormat ?? "",
      query.topicCategory ?? "",
      query.mediaType ?? "",
      String(query.limit ?? 30),
    ].join(":");
    return `${PREFIX}:pub:feed:${normalized}`;
  },
  publicationFeedPattern: `${PREFIX}:pub:feed:*`,
  publicationSlug(slug: string) {
    return `${PREFIX}:pub:slug:${slug}`;
  },
  publicationBackfillLock: `${PREFIX}:pub:backfill:lock`,
  user(userId: string) {
    return `${PREFIX}:user:${userId}`;
  },
  integrations(userId: string) {
    return `${PREFIX}:integrations:${userId}`;
  },
} as const;
