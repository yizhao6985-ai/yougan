const PREFIX = "yougan";

export type FeedCacheQuery = {
  contentFormat?: string;
  topicCategory?: string;
  mediaType?: string;
  mixedTextImage?: boolean;
  limit?: number;
};

export const cacheKeys = {
  publicationFeed(query: FeedCacheQuery) {
    const normalized = [
      query.contentFormat ?? "",
      query.topicCategory ?? "",
      query.mediaType ?? "",
      query.mixedTextImage ? "mixed" : "",
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
} as const;
