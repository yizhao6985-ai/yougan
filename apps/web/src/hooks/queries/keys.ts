import type { DiscoverFilters } from "@yougan/domain";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
    confirmEmail: (token: string) => ["auth", "confirm-email", token] as const,
  },
  works: {
    all: ["works"] as const,
    list: ["works", "list"] as const,
    conversations: (workId: string) =>
      ["works", workId, "conversations"] as const,
    openingBootstrap: (workId: string, conversationId: string) =>
      ["works", workId, "conversations", conversationId, "opening-bootstrap"] as const,
    versions: (workId: string) => ["works", workId, "versions"] as const,
  },
  workGroups: {
    all: ["work-groups"] as const,
    list: ["work-groups", "list"] as const,
  },
  publications: {
    all: ["publications"] as const,
    feed: (filters: DiscoverFilters) =>
      ["publications", "feed", filters] as const,
    bySlug: (slug: string) => ["publications", "slug", slug] as const,
    mine: ["publications", "mine"] as const,
    previewMetadata: (workId: string) =>
      ["publications", "preview-metadata", workId] as const,
  },
  subscription: {
    all: ["subscription"] as const,
    plans: ["subscription", "plans"] as const,
    current: ["subscription", "current"] as const,
  },
  billing: {
    all: ["billing"] as const,
    orders: ["billing", "orders"] as const,
  },
  users: {
    profile: (userId: string) => ["users", "profile", userId] as const,
    stats: (userId: string) => ["users", "stats", userId] as const,
    publications: (userId: string) =>
      ["users", "publications", userId] as const,
  },
} as const;
