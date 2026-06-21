import {
  applyPublicationSummaryOverrides,
  buildPublicationMetadata,
  buildPublicationSummaryPreview,
  buildFacetOptions,
  buildPublicationSlug,
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  DISCOVER_TOPIC_CATEGORIES,
  parseBlockComposition,
  previewHasContent,
  previewContentToLegacyBlocks,
  type PublicationSummaryOverrides,
  type WorkPreview,
} from "@yougan/domain";
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
import { parsePublicationBlocks } from "./materialize-production-draft-images.js";
import { summarizePublicationSummary } from "./summarize-publication-summary.js";
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
  coverBlockId?: string | null;
  compositionLabel?: string | null;
  consumptionHint?: string | null;
  blockComposition?: unknown;
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
    email: string | null;
    phone: string | null;
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
    coverBlockId: publication.coverBlockId ?? null,
    compositionLabel: publication.compositionLabel ?? null,
    consumptionHint: publication.consumptionHint ?? null,
    blockComposition: parseBlockComposition(publication.blockComposition),
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
          phone: publication.user.phone,
          bio: publication.user.bio ?? null,
          avatarUrl: publication.user.avatarUrl ?? null,
        }
      : undefined,
  };
}

export type PublicationFeedQuery = {
  contentFormat?: string;
  topicCategory?: string;
  mediaType?: string;
  mixedTextImage?: boolean;
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
      phone: true,
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

  if (query.contentFormat && omit !== "contentFormat") {
    where.contentFormat = query.contentFormat;
  }
  if (query.topicCategory && omit !== "topicCategory") {
    where.topicCategory = query.topicCategory;
  }
  if (query.mediaType && omit !== "mediaType") {
    where.mediaTypes = { has: query.mediaType };
  }
  if (query.mixedTextImage && omit !== "mixedTextImage") {
    where.AND = [
      { mediaTypes: { has: "text" } },
      { mediaTypes: { has: "image" } },
    ];
  }

  return where;
}

async function buildFacets(query: PublicationFeedQuery) {
  const [formatRows, topicRows] = await Promise.all([
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
    MEDIA_MODALITIES.map(async (item) => ({
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
    contentFormat: buildFacetOptions(
      CONTENT_FORMATS,
      toCountMap(formatRows, "contentFormat"),
    ),
    topicCategory: buildFacetOptions(
      DISCOVER_TOPIC_CATEGORIES,
      toCountMap(topicRows, "topicCategory"),
    ),
    mediaType: buildFacetOptions(
      MEDIA_MODALITIES,
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

function legacyMetadataFromSummary(
  work: { profile: unknown },
  summary: Awaited<ReturnType<typeof summarizePublicationSummary>>,
  blocks: WorkPreview["blocks"],
) {
  return buildPublicationMetadata({
    profile: work.profile,
    blocks,
    coverUrl: summary.cover.url || null,
  });
}

function summaryToPublicationFields(
  summary: Awaited<ReturnType<typeof summarizePublicationSummary>>,
  work: { profile: unknown },
  blocks: WorkPreview["blocks"],
  overrides?: PublicationSummaryOverrides | null,
) {
  const applied = applyPublicationSummaryOverrides(summary, overrides, blocks);
  const legacy = legacyMetadataFromSummary(work, applied, blocks);

  return {
    title: applied.title,
    excerpt: applied.hook,
    coverUrl: applied.cover.url || null,
    coverBlockId: applied.cover.sourceBlockId,
    compositionLabel: applied.compositionLabel,
    consumptionHint: applied.consumptionHint,
    blockComposition: applied.blockComposition,
    topicCategory: applied.topicCategory,
    contentTopic: legacy.contentTopic,
    contentType: legacy.contentType,
    contentFormat: legacy.contentFormat,
    mediaTypes: applied.mediaTypes,
  };
}

export async function previewPublicationSummaryForWork(
  userId: string,
  workId: string,
) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  const preview = work.preview as WorkPreview | null;
  if (!previewHasContent(preview)) {
    throw new Error("WORK_OUTPUT_EMPTY");
  }

  const blocks = previewContentToLegacyBlocks(preview!);

  const summary = await summarizePublicationSummary({
    blocks,
    preview,
    workTitle: work.title,
    profile: work.profile,
  });

  return buildPublicationSummaryPreview(summary, blocks);
}

export async function createPublicationFromWork(
  userId: string,
  input: {
    workId: string;
    publish?: boolean;
    summary?: PublicationSummaryOverrides;
  },
) {
  const work = await getWork(userId, input.workId);
  if (!work) return null;

  const preview = work.preview as WorkPreview | null;
  if (!previewHasContent(preview)) {
    throw new Error("WORK_OUTPUT_EMPTY");
  }

  const existing = await prisma.publication.findFirst({
    where: { userId, workId: input.workId, status: { not: "archived" } },
  });

  const blocks = previewContentToLegacyBlocks(preview!);

  const summary = await summarizePublicationSummary({
    blocks,
    preview,
    workTitle: work.title,
    profile: work.profile,
  });

  const overrides = input.summary;
  const fields = summaryToPublicationFields(
    summary,
    work,
    blocks,
    overrides,
  );

  const now = input.publish ? new Date() : null;

  if (existing) {
    const row = await prisma.publication.update({
      where: { id: existing.id },
      data: {
        ...fields,
        blocks: blocks as unknown as Prisma.InputJsonValue,
        blockComposition:
          fields.blockComposition as unknown as Prisma.InputJsonValue,
        hashtags: preview!.hashtags ?? [],
        status: input.publish ? "published" : existing.status,
        publishedAt: input.publish ? now : existing.publishedAt,
      } as unknown as Prisma.PublicationUpdateInput,
      include: userInclude,
    });
    await invalidatePublicationCaches(row.slug);
    return toPublicationDTO(row);
  }

  const row = await prisma.publication.create({
    data: {
      userId,
      workId: input.workId,
      slug: buildSlug(fields.title),
      ...fields,
      blocks: blocks as unknown as Prisma.InputJsonValue,
      blockComposition:
        fields.blockComposition as unknown as Prisma.InputJsonValue,
      hashtags: preview!.hashtags ?? [],
      status: input.publish ? "published" : "draft",
      publishedAt: now,
    } as unknown as Prisma.PublicationCreateInput,
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
