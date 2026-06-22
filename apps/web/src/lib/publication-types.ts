import type { WorkPreview } from "@yougan/domain";
import type { BlockComposition } from "@yougan/domain";

export type PublicationStatus = "draft" | "published" | "archived";

export interface PublicationAuthor {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface Publication {
  id: string;
  workId: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  preview: WorkPreview;
  coverUrl: string | null;
  coverImageId?: string | null;
  compositionLabel?: string | null;
  consumptionHint?: string | null;
  blockComposition?: BlockComposition;
  contentFormat: string | null;
  topicCategory: string | null;
  contentTopic: string | null;
  contentType: string | null;
  mediaTypes: string[];
  hashtags: string[];
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
