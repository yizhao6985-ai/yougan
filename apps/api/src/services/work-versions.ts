import { DEFAULT_CONVERSATION_TITLE, type WorkVersionSnapshot } from "@yougan/domain";

import { prisma } from "../db.js";
import type { WorkVersionDTO } from "../schemas.js";
import {
  emptySnapshot,
  hasValidPreview,
  materializeWorkColumns,
  parseProduction,
  parseProfileJson,
  parseSnapshot,
  previewVersionSummary,
  resolveProfileFromWork,
  resolveReferencesFromWork,
  shouldAppendPreviewVersion,
  snapshotsEqual,
  snapshotFromAgentValues,
} from "./versions.js";
import { syncMaterializedStateToAgentThreads } from "./agent-thread-sync.js";
import { materializeAgentRunValues } from "./materialize-production-draft-images.js";

function snapshotFromWorkColumns(work: {
  profile: unknown;
  references?: unknown;
  production: unknown;
}): WorkVersionSnapshot {
  return {
    profile: resolveProfileFromWork({ profile: work.profile }),
    references: resolveReferencesFromWork({
      references: work.references,
    }),
    production: parseProduction(work.production),
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
    data: columns,
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
  const values = await materializeAgentRunValues(input.values);
  const next = snapshotFromAgentValues(values);

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
      headVersionId: version.id,
    },
  });

  await syncMaterializedStateToAgentThreads(workId, {
    profile: columns.profile,
    references: columns.references,
    production: columns.production,
  });

  return toVersionDTO(version);
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
  let forkVersion: {
    summary: string;
    snapshot: unknown;
    createdAt: Date;
  } | null = null;

  if (options?.versionId) {
    const version = await prisma.workVersion.findFirst({
      where: { id: options.versionId, workId: sourceWorkId },
    });
    if (!version) return null;
    const parsed = parseSnapshot(version.snapshot);
    if (!hasValidPreview(parsed)) return null;
    snapshot = parsed;
    sourceVersionId = version.id;
    forkVersion = version;
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
        production: columns.production as object,
      },
    });

    const conversation = await tx.workConversation.create({
      data: {
        workId: createdWork.id,
        title: DEFAULT_CONVERSATION_TITLE,
      },
    });

    if (forkVersion) {
      const seededVersion = await tx.workVersion.create({
        data: {
          workId: createdWork.id,
          parentVersionId: null,
          conversationId: null,
          kind: "preview",
          summary: forkVersion.summary,
          snapshot: forkVersion.snapshot as object,
          createdAt: forkVersion.createdAt,
        },
      });
      await tx.work.update({
        where: { id: createdWork.id },
        data: { headVersionId: seededVersion.id },
      });
    }

    return { work: createdWork, conversationId: conversation.id };
  });

  const refreshed = await prisma.work.findUnique({
    where: { id: result.work.id },
  });
  return refreshed;
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
