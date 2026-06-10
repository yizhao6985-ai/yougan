import type { WorkVersionSnapshot } from "@yougan/domain";

import { prisma } from "../db.js";
import type { WorkVersionDTO } from "../schemas.js";
import {
  emptySnapshot,
  hasValidPreview,
  materializeWorkColumns,
  parsePreview,
  parseProductionPlanJson as parsePlan,
  parseProfileJson,
  parseSnapshot,
  previewVersionSummary,
  resolveProfileFromWork,
  resolveReferencesFromWork,
  shouldAppendPreviewVersion,
  snapshotsEqual,
  snapshotFromAgentValues,
} from "./versions.js";

function snapshotFromWorkColumns(work: {
  profile: unknown;
  references?: unknown;
  productionPlan: unknown;
  preview: unknown;
}): WorkVersionSnapshot {
  return {
    profile: resolveProfileFromWork({ profile: work.profile }),
    references: resolveReferencesFromWork({
      references: work.references,
      profile: work.profile,
    }),
    productionPlan: parsePlan(work.productionPlan),
    preview: parsePreview(work.preview),
  };
}

export async function getWorkCurrentSnapshot(workId: string) {
  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) return null;
  return snapshotFromWorkColumns(work);
}

async function updateWorkMaterializedState(
  workId: string,
  snapshot: WorkVersionSnapshot,
) {
  const columns = materializeWorkColumns(snapshot);
  await prisma.work.update({
    where: { id: workId },
    data: {
      ...columns,
      preview: columns.preview ?? undefined,
    },
  });
}

export async function appendWorkVersion(input: {
  workId: string;
  conversationId?: string;
  summary: string;
  snapshot: WorkVersionSnapshot;
}) {
  const version = await prisma.$transaction(async (tx) => {
    const parentVersionId = (
      await tx.work.findUnique({
        where: { id: input.workId },
        select: { headVersionId: true },
      })
    )?.headVersionId;

    const created = await tx.workVersion.create({
      data: {
        workId: input.workId,
        parentVersionId,
        conversationId: input.conversationId ?? null,
        kind: "preview",
        summary: input.summary,
        snapshot: input.snapshot as object,
      },
    });

    const columns = materializeWorkColumns(input.snapshot);
    await tx.work.update({
      where: { id: input.workId },
      data: {
        ...columns,
        preview: columns.preview ?? undefined,
        headVersionId: created.id,
      },
    });

    return created;
  });

  return toVersionDTO(version);
}

export async function applyAgentRunToWork(input: {
  workId: string;
  conversationId?: string;
  values: Record<string, unknown>;
}) {
  const previous = (await getWorkCurrentSnapshot(input.workId)) ?? emptySnapshot();
  const next = snapshotFromAgentValues(input.values);

  if (snapshotsEqual(previous, next)) {
    return null;
  }

  if (!shouldAppendPreviewVersion(previous, next)) {
    await updateWorkMaterializedState(input.workId, next);
    return null;
  }

  return appendWorkVersion({
    workId: input.workId,
    conversationId: input.conversationId,
    summary: previewVersionSummary(next),
    snapshot: next,
  });
}

export async function listWorkVersions(userId: string, workId: string) {
  const work = await prisma.work.findFirst({ where: { id: workId, userId } });
  if (!work) return null;

  const versions = await prisma.workVersion.findMany({
    where: { workId },
    orderBy: { createdAt: "desc" },
  });

  return versions
    .filter((version) => hasValidPreview(parseSnapshot(version.snapshot)))
    .map(toVersionDTO);
}

export async function restoreWorkToVersion(
  userId: string,
  workId: string,
  versionId: string,
) {
  const work = await prisma.work.findFirst({ where: { id: workId, userId } });
  if (!work) return null;

  const version = await prisma.workVersion.findFirst({
    where: { id: versionId, workId },
  });
  if (!version) return null;

  const snapshot = parseSnapshot(version.snapshot);
  if (!hasValidPreview(snapshot)) return null;

  const columns = materializeWorkColumns(snapshot);

  await prisma.work.update({
    where: { id: workId },
    data: {
      ...columns,
      preview: columns.preview ?? undefined,
      headVersionId: version.id,
    },
  });

  return toVersionDTO(version);
}

async function copyUserVisibleVersions(
  sourceWorkId: string,
  targetWorkId: string,
  upToVersionId?: string,
) {
  let upToCreatedAt: Date | undefined;
  if (upToVersionId) {
    const upTo = await prisma.workVersion.findFirst({
      where: { id: upToVersionId, workId: sourceWorkId },
    });
    if (!upTo) return null;
    upToCreatedAt = upTo.createdAt;
  }

  const sourceVersions = await prisma.workVersion.findMany({
    where: { workId: sourceWorkId },
    orderBy: { createdAt: "asc" },
  });

  const visible = sourceVersions.filter((version) => {
    if (!hasValidPreview(parseSnapshot(version.snapshot))) {
      return false;
    }
    if (upToCreatedAt && version.createdAt > upToCreatedAt) {
      return false;
    }
    return true;
  });

  if (!visible.length) {
    return null;
  }

  const idMap = new Map<string, string>();
  let lastCopiedId: string | null = null;

  await prisma.$transaction(async (tx) => {
    for (const source of visible) {
      const created = await tx.workVersion.create({
        data: {
          workId: targetWorkId,
          parentVersionId: source.parentVersionId
            ? (idMap.get(source.parentVersionId) ?? null)
            : null,
          conversationId: null,
          kind: "preview",
          summary: source.summary,
          snapshot: source.snapshot as object,
          createdAt: source.createdAt,
        },
      });
      idMap.set(source.id, created.id);
      lastCopiedId = created.id;
    }

    if (lastCopiedId) {
      await tx.work.update({
        where: { id: targetWorkId },
        data: { headVersionId: lastCopiedId },
      });
    }
  });

  return lastCopiedId;
}

export async function duplicateWorkFromVersion(
  userId: string,
  sourceWorkId: string,
  options?: {
    title?: string;
    groupId?: string | null;
    versionId?: string;
  },
) {
  const source = await prisma.work.findFirst({
    where: { id: sourceWorkId, userId },
  });
  if (!source) return null;

  let snapshot = (await getWorkCurrentSnapshot(sourceWorkId)) ?? emptySnapshot();
  let sourceVersionId = source.headVersionId;

  if (options?.versionId) {
    const version = await prisma.workVersion.findFirst({
      where: { id: options.versionId, workId: sourceWorkId },
    });
    if (!version) return null;
    snapshot = parseSnapshot(version.snapshot);
    sourceVersionId = version.id;
  }

  const title = options?.title?.trim() || `${source.title} · 副本`;
  const groupId =
    options?.groupId !== undefined ? options.groupId : source.groupId;

  if (groupId) {
    const group = await prisma.workGroup.findFirst({
      where: { id: groupId, userId },
    });
    if (!group) return null;
  }

  const columns = materializeWorkColumns(snapshot);

  const result = await prisma.$transaction(async (tx) => {
    const createdWork = await tx.work.create({
      data: {
        userId,
        groupId,
        title,
        sourceWorkId,
        sourceVersionId,
        profile: columns.profile as object,
        references: columns.references as object,
        productionPlan: columns.productionPlan as object,
        preview: columns.preview ?? undefined,
      },
    });

    const conversation = await tx.workConversation.create({
      data: {
        workId: createdWork.id,
        title: "对话 1",
      },
    });

    return { work: createdWork, conversationId: conversation.id };
  });

  await copyUserVisibleVersions(
    sourceWorkId,
    result.work.id,
    options?.versionId,
  );

  return result.work;
}

function toVersionDTO(version: {
  id: string;
  workId: string;
  parentVersionId: string | null;
  conversationId: string | null;
  summary: string;
  snapshot: unknown;
  createdAt: Date;
}): WorkVersionDTO {
  return {
    id: version.id,
    workId: version.workId,
    parentVersionId: version.parentVersionId,
    conversationId: version.conversationId,
    summary: version.summary,
    snapshot: parseSnapshot(version.snapshot),
    createdAt: version.createdAt.toISOString(),
  };
}

export { parseSnapshot, snapshotFromAgentValues };
