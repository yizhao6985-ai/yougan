import { Prisma, type Work } from "../db.js";
import {
  DEFAULT_CONVERSATION_TITLE,
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_PRODUCTION,
  EMPTY_WORK_REFERENCES,
  EMPTY_WORK_REVISION,
  normalizeWorkDto,
  resolveProfileFromWork,
  resolveReferencesFromWork,
} from "@yougan/domain";

import { prisma } from "../db.js";
import type { WorkDTO } from "../schemas.js";
import { getWorkGroup } from "./work-groups.js";
import {
  applyAgentRunToWork,
  duplicateWorkFromVersion,
  parseSnapshot,
} from "./work-versions.js";
import {
  materializeWorkColumns,
  parseProduction,
  parsePreview,
  parseProfileJson,
  parseRevisionJson,
} from "./versions.js";
import {
  hasMaterializedAgentFields,
  materializedFieldsFromWorkUpdate,
  syncMaterializedStateToAgentThreads,
} from "./agent-thread-sync.js";

function toWorkDTO(work: Work): WorkDTO {
  const withColumns = work as Work & { preview?: unknown; revision?: unknown };
  return normalizeWorkDto({
    id: work.id,
    title: work.title,
    groupId: work.groupId,
    profile: resolveProfileFromWork({ profile: work.profile }),
    references: resolveReferencesFromWork({
      references: (work as Work & { references?: unknown }).references,
    }),
    preview: withColumns.preview,
    revision: withColumns.revision,
    production: parseProduction(work.production),
    headVersionId: work.headVersionId,
    sourceWorkId: work.sourceWorkId,
    sourceVersionId: work.sourceVersionId,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
  }) as WorkDTO;
}

export async function listWorks(userId: string) {
  const works = await prisma.work.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return works.map(toWorkDTO);
}

export async function createWork(
  userId: string,
  title?: string,
  groupId?: string | null,
) {
  if (groupId) {
    const group = await getWorkGroup(userId, groupId);
    if (!group) {
      throw new Error("Group not found");
    }
  }

  const work = await prisma.$transaction(async (tx) => {
    const createdWork = await tx.work.create({
      data: {
        userId,
        groupId: groupId ?? null,
        title: title?.trim() || "未命名作品",
        profile: EMPTY_WORK_PROFILE as unknown as Prisma.InputJsonValue,
        references: EMPTY_WORK_REFERENCES as unknown as Prisma.InputJsonValue,
        preview: Prisma.JsonNull,
        revision: EMPTY_WORK_REVISION as unknown as Prisma.InputJsonValue,
        production: EMPTY_WORK_PRODUCTION as unknown as Prisma.InputJsonValue,
      },
    });

    const conversation = await tx.workConversation.create({
      data: {
        workId: createdWork.id,
        title: DEFAULT_CONVERSATION_TITLE,
      },
    });

    return { work: createdWork, conversationId: conversation.id };
  });

  const refreshed = await prisma.work.findUnique({
    where: { id: work.work.id },
  });
  return toWorkDTO(refreshed!);
}

export async function duplicateWork(
  userId: string,
  sourceWorkId: string,
  options?: {
    title?: string;
    groupId?: string | null;
    versionId?: string;
  },
) {
  const work = await duplicateWorkFromVersion(userId, sourceWorkId, options);
  if (!work) return null;
  return toWorkDTO(work);
}

export async function getWork(userId: string, workId: string) {
  const work = await prisma.work.findFirst({ where: { id: workId, userId } });
  if (!work) return null;
  return toWorkDTO(work);
}

export async function updateWork(
  userId: string,
  workId: string,
  data: Partial<{
    title: string;
    groupId: string | null;
    profile: unknown;
    references: unknown;
    preview: unknown | null;
    revision: unknown;
    production: unknown;
  }>,
  options?: { conversationId?: string },
) {
  const existing = await prisma.work.findFirst({
    where: { id: workId, userId },
  });
  if (!existing) return null;

  if (data.groupId) {
    const group = await getWorkGroup(userId, data.groupId);
    if (!group) return null;
  }

  const updateData: Prisma.WorkUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.groupId !== undefined) {
    updateData.group =
      data.groupId === null
        ? { disconnect: true }
        : { connect: { id: data.groupId } };
  }
  if (data.profile !== undefined) {
    updateData.profile = parseProfileJson(
      data.profile,
    ) as unknown as Prisma.InputJsonValue;
  }
  if (data.references !== undefined) {
    updateData.references = resolveReferencesFromWork({
      references: data.references,
    }) as unknown as Prisma.InputJsonValue;
  }
  if (data.production !== undefined) {
    updateData.production = parseProduction(
      data.production,
    ) as unknown as Prisma.InputJsonValue;
  }
  if (data.preview !== undefined) {
    updateData.preview =
      data.preview === null
        ? Prisma.JsonNull
        : (parsePreview(data.preview) as unknown as Prisma.InputJsonValue);
  }
  if (data.revision !== undefined) {
    updateData.revision = parseRevisionJson(
      data.revision,
    ) as unknown as Prisma.InputJsonValue;
  }

  const work = await prisma.work.update({
    where: { id: workId },
    data: updateData,
  });
  const dto = toWorkDTO(work);

  const agentFields = materializedFieldsFromWorkUpdate(data);
  if (hasMaterializedAgentFields(agentFields)) {
    const syncFields: typeof agentFields = {};
    if (agentFields.profile !== undefined) syncFields.profile = dto.profile;
    if (agentFields.references !== undefined)
      syncFields.references = dto.references;
    if (agentFields.production !== undefined)
      syncFields.production = dto.production;
    if (agentFields.preview !== undefined) syncFields.preview = dto.preview;
    if (agentFields.revision !== undefined) syncFields.revision = dto.revision;
    await syncMaterializedStateToAgentThreads(workId, syncFields, {
      conversationId: options?.conversationId,
    });
  }

  return dto;
}

export async function deleteWork(userId: string, workId: string) {
  const existing = await prisma.work.findFirst({
    where: { id: workId, userId },
  });
  if (!existing) return false;
  await prisma.work.delete({ where: { id: workId } });
  return true;
}

export async function getAgentContext(
  userId: string,
  workId: string,
  conversationId?: string,
) {
  const work = await prisma.work.findFirst({ where: { id: workId, userId } });
  if (!work) return null;

  let threadId: string | null = null;
  let resolvedConversationId: string | undefined;
  let conversationTitle: string | undefined;

  if (conversationId) {
    const conversation = await prisma.workConversation.findFirst({
      where: { id: conversationId, workId },
    });
    if (conversation) {
      threadId = conversation.threadId;
      resolvedConversationId = conversation.id;
      conversationTitle = conversation.title;
    }
  }

  const dto = toWorkDTO(work);

  return {
    workId: work.id,
    conversationId: resolvedConversationId,
    headVersionId: work.headVersionId,
    profile: dto.profile,
    references: dto.references,
    preview: dto.preview,
    revision: dto.revision,
    production: dto.production,
    threadId,
    workTitle: work.title,
    conversationTitle,
  };
}

export async function applyAgentRunVersion(input: {
  userId: string;
  workId: string;
  conversationId?: string;
  values: Record<string, unknown>;
}) {
  const work = await prisma.work.findFirst({
    where: { id: input.workId, userId: input.userId },
  });
  if (!work) return null;

  return applyAgentRunToWork({
    workId: input.workId,
    conversationId: input.conversationId,
    values: input.values,
  });
}

export { toWorkDTO, materializeWorkColumns, parseSnapshot };
