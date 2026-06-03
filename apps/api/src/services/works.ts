import { Prisma, type Work } from "../db.js";
import {
  EMPTY_WORK_BRIEF,
  EMPTY_WORK_OUTLINE,
  EMPTY_WORK_PRODUCTION_PLAN,
  EMPTY_WORK_PROFILE,
} from "@yougan/domain";

import { prisma } from "../db.js";
import type { WorkDTO } from "../schemas.js";
import { getWorkGroup } from "./work-groups.js";
import {
  applyAgentRunToWork,
  duplicateWorkFromRevision,
  parseSnapshot,
} from "./work-revisions.js";
import {
  materializeWorkColumns,
  parseBrief,
  parseDraft,
  parseOutline,
  parsePlan,
  parseProfile,
} from "./revisions.js";
import {
  hasMaterializedAgentFields,
  materializedFieldsFromWorkUpdate,
  syncMaterializedStateToAgentThreads,
} from "./agent-thread-sync.js";

function toWorkDTO(work: Work): WorkDTO {
  return {
    id: work.id,
    title: work.title,
    groupId: work.groupId,
    profile: parseProfile(work.profile),
    brief: parseBrief(work.brief),
    outline: parseOutline(work.outline),
    plan: parsePlan(work.plan),
    draft: parseDraft(work.draft),
    headRevisionId: work.headRevisionId,
    sourceWorkId: work.sourceWorkId,
    sourceRevisionId: work.sourceRevisionId,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
  };
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
        brief: EMPTY_WORK_BRIEF as unknown as Prisma.InputJsonValue,
        outline: EMPTY_WORK_OUTLINE as unknown as Prisma.InputJsonValue,
        plan: EMPTY_WORK_PRODUCTION_PLAN as unknown as Prisma.InputJsonValue,
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
    revisionId?: string;
  },
) {
  const work = await duplicateWorkFromRevision(userId, sourceWorkId, options);
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
    outline: unknown;
    plan: unknown;
    brief: unknown;
    draft: unknown | null;
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
    updateData.profile = data.profile as Prisma.InputJsonValue;
  }
  if (data.outline !== undefined) {
    updateData.outline = data.outline as Prisma.InputJsonValue;
  }
  if (data.plan !== undefined) {
    updateData.plan = data.plan as Prisma.InputJsonValue;
  }
  if (data.brief !== undefined) {
    updateData.brief = data.brief as Prisma.InputJsonValue;
  }
  if (data.draft !== undefined) {
    updateData.draft =
      data.draft === null
        ? Prisma.JsonNull
        : (data.draft as Prisma.InputJsonValue);
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
    if (agentFields.brief !== undefined) syncFields.brief = dto.brief;
    if (agentFields.outline !== undefined) syncFields.outline = dto.outline;
    if (agentFields.draft !== undefined) syncFields.draft = dto.draft;
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

  return {
    workId: work.id,
    conversationId: resolvedConversationId,
    headRevisionId: work.headRevisionId,
    profile: parseProfile(work.profile),
    brief: parseBrief(work.brief),
    outline: parseOutline(work.outline),
    plan: parsePlan(work.plan),
    draft: parseDraft(work.draft),
    threadId,
    workTitle: work.title,
    conversationTitle,
  };
}

export async function applyAgentRunRevision(input: {
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
