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

export async function getWorkHeadSnapshot(workId: string) {
  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) return null;

  if (work.headRevisionId) {
    const head = await prisma.workRevision.findUnique({
      where: { id: work.headRevisionId },
    });
    if (head) return parseSnapshot(head.snapshot);
  }

  return {
    profile: parseProfile(work.profile),
    brief: parseBrief(work.brief),
    plan: parsePlan(work.plan),
    draft: parseDraft(work.draft),
  };
}

async function getWorkParentRevisionId(workId: string) {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { headRevisionId: true },
  });
  return work?.headRevisionId ?? null;
}

export async function appendWorkRevision(input: {
  workId: string;
  conversationId?: string;
  kind: import("@yougan/domain").RevisionKind;
  summary: string;
  snapshot: import("@yougan/domain").WorkRevisionSnapshot;
}) {
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

export async function initializeWorkRevisionTimeline(
  workId: string,
  conversationId?: string,
  snapshot = emptySnapshot(),
  kind: import("@yougan/domain").RevisionKind = "work_created",
  summary = "创建作品",
) {
  const existing = await prisma.workRevision.findFirst({
    where: { workId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const revision = await appendWorkRevision({
    workId,
    conversationId,
    kind,
    summary,
    snapshot,
  });
  return revision.id;
}

export async function applyAgentRunToWork(input: {
  workId: string;
  conversationId?: string;
  values: Record<string, unknown>;
}) {
  const previous = (await getWorkHeadSnapshot(input.workId)) ?? emptySnapshot();
  const next = snapshotFromAgentValues(input.values);

  if (snapshotsEqual(previous, next)) {
    return null;
  }

  const kind = detectRevisionKind(previous, next);
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

  return revisions.map(toRevisionDTO);
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

  const snapshot = parseSnapshot(revision.snapshot);

  return appendWorkRevision({
    workId,
    kind: "work_restored",
    summary: `回到：${revision.summary}`,
    snapshot,
  });
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

  let snapshot = (await getWorkHeadSnapshot(sourceWorkId)) ?? emptySnapshot();
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

  await appendWorkRevision({
    workId: result.work.id,
    conversationId: result.conversationId,
    kind: "work_duplicated",
    summary: `从「${source.title}」另存为新作品`,
    snapshot,
  });

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
  return {
    id: revision.id,
    workId: revision.workId,
    parentRevisionId: revision.parentRevisionId,
    conversationId: revision.conversationId,
    kind: revision.kind as WorkRevisionDTO["kind"],
    summary: revision.summary,
    snapshot: parseSnapshot(revision.snapshot),
    createdAt: revision.createdAt.toISOString(),
  };
}

export { parseSnapshot, snapshotFromAgentValues };
