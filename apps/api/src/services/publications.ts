import { buildPublicationSlug } from "@yougan/domain";

import {
  applyMetadataOverrides,
  buildFacetOptions,
  buildMetadataLabels,
  buildPublicationMetadata,
  DISCOVER_FORMATS,
  DISCOVER_MEDIA_TYPES,
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  previewCoverUrl,
  previewExcerpt,
  previewHasContent,
  type PublicationMetadataOverrides,
  type WorkPreview,
} from "../lib/discover-taxonomy.js";
import {
  cacheGetJson,
  cacheKeys,
  cacheSetJson,
  cacheTtl,
  invalidatePublicationCaches,
} from "../lib/cache.js";
import { prisma } from "../db.js";
import type { Prisma } from "@prisma/client";
import type { PublicationDTO, PublicationStatus } from "../schemas.js";
import { parsePublicationBlocks } from "./materialize-preview-images.js";
import { getWork } from "./works.js";

function buildSlug(title: string) {
  return buildPublicationSlug(title);
}

type PublicationRow = {
  id: string;
  userId: string;
  workId: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  blocks: unknown;
  coverUrl: string | null;
  platform: string | null;
  contentFormat: string | null;
  topicCategory: string | null;
  contentTopic: string | null;
  contentType: string | null;
  mediaTypes: string[];
  hashtags: unknown;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
};

function toPublicationDTO(publication: PublicationRow): PublicationDTO {
  return {
    id: publication.id,
    workId: publication.workId,
    slug: publication.slug,
    title: publication.title,
    excerpt: publication.excerpt,
    blocks: parsePublicationBlocks(publication.blocks),
    coverUrl: publication.coverUrl,
    platform: publication.platform,
    contentFormat: publication.contentFormat,
    topicCategory: publication.topicCategory,
    contentTopic: publication.contentTopic,
    contentType: publication.contentType,
    mediaTypes: publication.mediaTypes,
    hashtags: Array.isArray(publication.hashtags)
      ? (publication.hashtags as string[])
      : [],
    status: publication.status as PublicationStatus,
    publishedAt: publication.publishedAt?.toISOString() ?? null,
    createdAt: publication.createdAt.toISOString(),
    updatedAt: publication.updatedAt.toISOString(),
    author: publication.user
      ? {
          id: publication.user.id,
          name: publication.user.name,
          email: publication.user.email,
          bio: publication.user.bio ?? null,
          avatarUrl: publication.user.avatarUrl ?? null,
        }
      : undefined,
  };
}

export type PublicationFeedQuery = {
  platform?: string;
  contentFormat?: string;
  topicCategory?: string;
  mediaType?: string;
  limit?: number;
};

export type DiscoverFacetOption = {
  id: string;
  label: string;
  count: number;
};

export type PublicationFeedResult = {
  publications: PublicationDTO[];
  total: number;
  facets: {
    platform: DiscoverFacetOption[];
    contentFormat: DiscoverFacetOption[];
    topicCategory: DiscoverFacetOption[];
    mediaType: DiscoverFacetOption[];
  };
};

const userInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
    },
  },
} as const;

function buildPublishedWhere(
  query: PublicationFeedQuery,
  omit?: keyof PublicationFeedQuery,
): Prisma.PublicationWhereInput {
  const where: Prisma.PublicationWhereInput = { status: "published" };

  if (query.platform && omit !== "platform") {
    where.platform = query.platform;
  }
  if (query.contentFormat && omit !== "contentFormat") {
    where.contentFormat = query.contentFormat;
  }
  if (query.topicCategory && omit !== "topicCategory") {
    where.topicCategory = query.topicCategory;
  }
  if (query.mediaType && omit !== "mediaType") {
    where.mediaTypes = { has: query.mediaType };
  }

  return where;
}

async function buildFacets(query: PublicationFeedQuery) {
  const [platformRows, formatRows, topicRows] = await Promise.all([
    prisma.publication.groupBy({
      by: ["platform"],
      where: buildPublishedWhere(query, "platform"),
      _count: { _all: true },
    }),
    prisma.publication.groupBy({
      by: ["contentFormat"],
      where: buildPublishedWhere(query, "contentFormat"),
      _count: { _all: true },
    }),
    prisma.publication.groupBy({
      by: ["topicCategory"],
      where: buildPublishedWhere(query, "topicCategory"),
      _count: { _all: true },
    }),
  ]);

  const mediaCounts = await Promise.all(
    DISCOVER_MEDIA_TYPES.map(async (item) => ({
      id: item.id,
      count: await prisma.publication.count({
        where: {
          ...buildPublishedWhere(query, "mediaType"),
          mediaTypes: { has: item.id },
        },
      }),
    })),
  );

  const toCountMap = (
    rows: Array<{ _count: { _all: number } } & Record<string, unknown>>,
    key: string,
  ) =>
    Object.fromEntries(
      rows
        .filter((row) => typeof row[key] === "string" && row[key])
        .map((row) => [row[key] as string, row._count._all]),
    );

  return {
    platform: buildFacetOptions(
      DISCOVER_PLATFORMS,
      toCountMap(platformRows, "platform"),
    ),
    contentFormat: buildFacetOptions(
      DISCOVER_FORMATS,
      toCountMap(formatRows, "contentFormat"),
    ),
    topicCategory: buildFacetOptions(
      DISCOVER_TOPIC_CATEGORIES,
      toCountMap(topicRows, "topicCategory"),
    ),
    mediaType: buildFacetOptions(
      DISCOVER_MEDIA_TYPES,
      Object.fromEntries(mediaCounts.map((row) => [row.id, row.count])),
    ),
  };
}

async function fetchPublicationFeedFromDb(
  query: PublicationFeedQuery = {},
): Promise<PublicationFeedResult> {
  const where = buildPublishedWhere(query);
  const limit = Math.min(Math.max(query.limit ?? 30, 1), 60);

  const [rows, total, facets] = await Promise.all([
    prisma.publication.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: userInclude,
    }),
    prisma.publication.count({ where }),
    buildFacets(query),
  ]);

  return {
    publications: rows.map(toPublicationDTO),
    total,
    facets,
  };
}

export async function listPublicationFeed(
  query: PublicationFeedQuery = {},
): Promise<PublicationFeedResult> {
  const cacheKey = cacheKeys.publicationFeed(query);
  const cached = await cacheGetJson<PublicationFeedResult>(cacheKey);
  if (cached) return cached;

  const result = await fetchPublicationFeedFromDb(query);
  await cacheSetJson(cacheKey, result, cacheTtl.publicationFeedTtl);
  return result;
}

export async function recordPublicationView(publicationId: string) {
  await prisma.publication.updateMany({
    where: { id: publicationId, status: "published" },
    data: { viewCount: { increment: 1 } },
  });
}

export async function getPublicationBySlug(slugOrId: string) {
  const cacheKey = cacheKeys.publicationSlug(slugOrId);
  const cached = await cacheGetJson<PublicationDTO>(cacheKey);
  if (cached) return cached;

  const publishedWhere = { status: "published" as const };

  let row = await prisma.publication.findFirst({
    where: { slug: slugOrId, ...publishedWhere },
    include: userInclude,
  });

  if (!row) {
    row = await prisma.publication.findFirst({
      where: { id: slugOrId, ...publishedWhere },
      include: userInclude,
    });
  }

  if (!row) return null;

  const publication = toPublicationDTO(row);
  await cacheSetJson(cacheKey, publication, cacheTtl.publicationSlugTtl);
  if (publication.slug !== slugOrId) {
    await cacheSetJson(
      cacheKeys.publicationSlug(publication.slug),
      publication,
      cacheTtl.publicationSlugTtl,
    );
  }
  return publication;
}

export async function listUserPublications(userId: string) {
  const rows = await prisma.publication.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: userInclude,
  });
  return rows.map(toPublicationDTO);
}

export async function listUserPublishedPublications(
  userId: string,
  limit = 30,
) {
  const exists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) return null;

  const take = Math.min(Math.max(limit, 1), 60);
  const rows = await prisma.publication.findMany({
    where: { userId, status: "published" },
    orderBy: { publishedAt: "desc" },
    take,
    include: userInclude,
  });
  return rows.map(toPublicationDTO);
}

function metadataFromWork(
  work: { profile: unknown },
  preview: WorkPreview,
  coverUrl: string | null,
  overrides?: PublicationMetadataOverrides,
) {
  const inferred = buildPublicationMetadata({
    profile: work.profile,
    output: preview,
    coverUrl,
    blocks: preview.blocks,
    platform: preview.platform,
  });
  return applyMetadataOverrides(inferred, overrides);
}

export async function previewPublicationMetadata(
  userId: string,
  workId: string,
) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  const preview = work.production.preview as WorkPreview | null;
  if (!previewHasContent(preview)) {
    throw new Error("WORK_OUTPUT_EMPTY");
  }

  const coverUrl = previewCoverUrl(preview);
  const metadata = metadataFromWork(work, preview, coverUrl);

  return {
    metadata,
    labels: buildMetadataLabels(metadata),
  };
}

export async function createPublicationFromWork(
  userId: string,
  input: {
    workId: string;
    publish?: boolean;
    metadata?: PublicationMetadataOverrides;
  },
) {
  const work = await getWork(userId, input.workId);
  if (!work) return null;

  const preview = work.production.preview as WorkPreview | null;
  if (!previewHasContent(preview)) {
    throw new Error("WORK_OUTPUT_EMPTY");
  }

  const existing = await prisma.publication.findFirst({
    where: { userId, workId: input.workId, status: { not: "archived" } },
  });

  const title = preview!.title?.trim() || work.title;
  const excerpt = previewExcerpt(preview);
  const coverUrl = previewCoverUrl(preview);
  const now = input.publish ? new Date() : null;
  const metadata = metadataFromWork(work, preview!, coverUrl, input.metadata);

  if (existing) {
    const row = await prisma.publication.update({
      where: { id: existing.id },
      data: {
        title,
        excerpt,
        blocks: preview!.blocks,
        coverUrl,
        hashtags: preview!.hashtags ?? [],
        status: input.publish ? "published" : existing.status,
        publishedAt: input.publish ? now : existing.publishedAt,
        ...metadata,
      },
      include: userInclude,
    });
    await invalidatePublicationCaches(row.slug);
    return toPublicationDTO(row);
  }

  const row = await prisma.publication.create({
    data: {
      userId,
      workId: input.workId,
      slug: buildSlug(title),
      title,
      excerpt,
      blocks: preview!.blocks,
      coverUrl,
      hashtags: preview!.hashtags ?? [],
      status: input.publish ? "published" : "draft",
      publishedAt: now,
      ...metadata,
    },
    include: userInclude,
  });
  await invalidatePublicationCaches(row.slug);
  return toPublicationDTO(row);
}

export async function updatePublicationStatus(
  userId: string,
  publicationId: string,
  status: PublicationStatus,
) {
  const existing = await prisma.publication.findFirst({
    where: { id: publicationId, userId },
  });
  if (!existing) return null;

  const row = await prisma.publication.update({
    where: { id: publicationId },
    data: {
      status,
      publishedAt:
        status === "published"
          ? (existing.publishedAt ?? new Date())
          : status === "draft"
            ? null
            : existing.publishedAt,
    },
    include: userInclude,
  });
  await invalidatePublicationCaches(row.slug);
  return toPublicationDTO(row);
}

export async function deletePublication(userId: string, publicationId: string) {
  const existing = await prisma.publication.findFirst({
    where: { id: publicationId, userId },
  });
  if (!existing) return false;
  await prisma.publication.delete({ where: { id: publicationId } });
  await invalidatePublicationCaches(existing.slug);
  return true;
}
