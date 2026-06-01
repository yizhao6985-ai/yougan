import {
  isUserVisibleRevisionKind,
  userRevisionPhase,
  type RevisionKind,
  type WorkRevisionSnapshot,
} from "@yougan/domain";

import { prisma } from "../db.js";
import type { WorkRevisionDTO } from "../schemas.js";
import {
  detectRevisionKind,
  emptySnapshot,
  materializeWorkColumns,
  parseBrief,
  parseDraft,
  parsePlan,
  parseProfile,
  parseSnapshot,
  revisionSummary,
  snapshotsEqual,
  snapshotFromAgentValues,
} from "./revisions.js";

function snapshotFromWorkColumns(work: {
  profile: unknown;
  brief: unknown;
  plan: unknown;
  draft: unknown;
}): WorkRevisionSnapshot {
  return {
    profile: parseProfile(work.profile),
    brief: parseBrief(work.brief),
    plan: parsePlan(work.plan),
    draft: parseDraft(work.draft),
  };
}

export async function getWorkCurrentSnapshot(workId: string) {
  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) return null;
  return snapshotFromWorkColumns(work);
}

/** @deprecated 读取 head revision 快照；Agent 同步请用 getWorkCurrentSnapshot */
export async function getWorkHeadSnapshot(workId: string) {
  return getWorkCurrentSnapshot(workId);
}

async function updateWorkMaterializedState(
  workId: string,
  snapshot: WorkRevisionSnapshot,
) {
  const columns = materializeWorkColumns(snapshot);
  await prisma.work.update({
    where: { id: workId },
    data: {
      ...columns,
      draft: columns.draft ?? undefined,
    },
  });
}

export async function appendWorkRevision(input: {
  workId: string;
  conversationId?: string;
  kind: RevisionKind;
  summary: string;
  snapshot: WorkRevisionSnapshot;
}) {
  const phase = userRevisionPhase(input.kind);
  if (!phase) {
    throw new Error(`Revision kind is not user-visible: ${input.kind}`);
  }

  const revision = await prisma.$transaction(async (tx) => {
    const parentRevisionId = (
      await tx.work.findUnique({
        where: { id: input.workId },
        select: { headRevisionId: true },
      })
    )?.headRevisionId;

    const created = await tx.workRevision.create({
      data: {
        workId: input.workId,
        parentRevisionId,
        conversationId: input.conversationId ?? null,
        kind: input.kind,
        summary: input.summary,
        snapshot: input.snapshot as object,
      },
    });

    const columns = materializeWorkColumns(input.snapshot);
    await tx.work.update({
      where: { id: input.workId },
      data: {
        ...columns,
        draft: columns.draft ?? undefined,
        headRevisionId: created.id,
      },
    });

    return created;
  });

  return toRevisionDTO(revision);
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

  const kind = detectRevisionKind(previous, next);
  if (!isUserVisibleRevisionKind(kind)) {
    await updateWorkMaterializedState(input.workId, next);
    return null;
  }

  const summary = revisionSummary(kind, previous, next);

  return appendWorkRevision({
    workId: input.workId,
    conversationId: input.conversationId,
    kind,
    summary,
    snapshot: next,
  });
}

export async function listWorkRevisions(userId: string, workId: string) {
  const work = await prisma.work.findFirst({ where: { id: workId, userId } });
  if (!work) return null;

  const revisions = await prisma.workRevision.findMany({
    where: { workId },
    orderBy: { createdAt: "desc" },
  });

  return revisions
    .filter((revision) =>
      isUserVisibleRevisionKind(revision.kind as RevisionKind),
    )
    .map(toRevisionDTO);
}

export async function restoreWorkToRevision(
  userId: string,
  workId: string,
  revisionId: string,
) {
  const work = await prisma.work.findFirst({ where: { id: workId, userId } });
  if (!work) return null;

  const revision = await prisma.workRevision.findFirst({
    where: { id: revisionId, workId },
  });
  if (!revision) return null;
  if (!isUserVisibleRevisionKind(revision.kind as RevisionKind)) return null;

  const snapshot = parseSnapshot(revision.snapshot);
  const columns = materializeWorkColumns(snapshot);

  await prisma.work.update({
    where: { id: workId },
    data: {
      ...columns,
      draft: columns.draft ?? undefined,
      headRevisionId: revision.id,
    },
  });

  return toRevisionDTO(revision);
}

async function copyUserVisibleRevisions(
  sourceWorkId: string,
  targetWorkId: string,
  upToRevisionId?: string,
) {
  let upToCreatedAt: Date | undefined;
  if (upToRevisionId) {
    const upTo = await prisma.workRevision.findFirst({
      where: { id: upToRevisionId, workId: sourceWorkId },
    });
    if (!upTo) return null;
    upToCreatedAt = upTo.createdAt;
  }

  const sourceRevisions = await prisma.workRevision.findMany({
    where: { workId: sourceWorkId },
    orderBy: { createdAt: "asc" },
  });

  const visible = sourceRevisions.filter((revision) => {
    if (!isUserVisibleRevisionKind(revision.kind as RevisionKind)) {
      return false;
    }
    if (upToCreatedAt && revision.createdAt > upToCreatedAt) {
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
      const created = await tx.workRevision.create({
        data: {
          workId: targetWorkId,
          parentRevisionId: source.parentRevisionId
            ? (idMap.get(source.parentRevisionId) ?? null)
            : null,
          conversationId: null,
          kind: source.kind,
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
        data: { headRevisionId: lastCopiedId },
      });
    }
  });

  return lastCopiedId;
}

export async function duplicateWorkFromRevision(
  userId: string,
  sourceWorkId: string,
  options?: {
    title?: string;
    groupId?: string | null;
    revisionId?: string;
  },
) {
  const source = await prisma.work.findFirst({
    where: { id: sourceWorkId, userId },
  });
  if (!source) return null;

  let snapshot = (await getWorkCurrentSnapshot(sourceWorkId)) ?? emptySnapshot();
  let sourceRevisionId = source.headRevisionId;

  if (options?.revisionId) {
    const revision = await prisma.workRevision.findFirst({
      where: { id: options.revisionId, workId: sourceWorkId },
    });
    if (!revision) return null;
    snapshot = parseSnapshot(revision.snapshot);
    sourceRevisionId = revision.id;
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
        sourceRevisionId,
        profile: columns.profile as object,
        brief: columns.brief as object,
        plan: columns.plan as object,
        draft: columns.draft ?? undefined,
      },
    });

    const conversation = await tx.workConversation.create({
      data: {
        workId: createdWork.id,
        title: "对话 1",
        mode: "inspiration",
      },
    });

    return { work: createdWork, conversationId: conversation.id };
  });

  await copyUserVisibleRevisions(
    sourceWorkId,
    result.work.id,
    options?.revisionId,
  );

  return result.work;
}

function toRevisionDTO(revision: {
  id: string;
  workId: string;
  parentRevisionId: string | null;
  conversationId: string | null;
  kind: string;
  summary: string;
  snapshot: unknown;
  createdAt: Date;
}): WorkRevisionDTO {
  const kind = revision.kind as RevisionKind;
  const phase = userRevisionPhase(kind);
  if (!phase) {
    throw new Error(`Revision kind is not user-visible: ${kind}`);
  }

  return {
    id: revision.id,
    workId: revision.workId,
    parentRevisionId: revision.parentRevisionId,
    conversationId: revision.conversationId,
    kind,
    phase,
    summary: revision.summary,
    snapshot: parseSnapshot(revision.snapshot),
    createdAt: revision.createdAt.toISOString(),
  };
}

export { parseSnapshot, snapshotFromAgentValues };
