export type PublicationStatus = "draft" | "published" | "archived";

export interface PublicationAuthor {
  id: string;
  name: string | null;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface Publication {
  id: string;
  workId: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  platform: string | null;
  contentFormat: string | null;
  topicCategory: string | null;
  contentTopic: string | null;
  contentType: string | null;
  mediaType: string | null;
  hashtags: string[];
  images: Array<Record<string, unknown>>;
  status: PublicationStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: PublicationAuthor;
}

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};
