import { Prisma, type Work } from "@prisma/client";

import { prisma } from "../db.js";
import type { WorkDTO } from "../schemas.js";
import { CHAT_MODES } from "../schemas.js";
import { getWorkGroup } from "./work-groups.js";

const EMPTY_WORK_PROFILE = {
  platform: null,
  content_topic: null,
  content_type: null,
  content_format: null,
  media_modality: null,
  content_points: [],
  style: null,
  tone: null,
  persona: null,
  audience: null,
  goals: [],
  style_constraints: [],
  notes: null,
  references: [],
};

const EMPTY_WORK_OUTLINE = {
  pending_changes: [],
  executed_changes: [],
  last_execution_summary: null,
  plan_ready: false,
  plan_summary: null,
  departments: [],
  industry_context: null,
  creative_director_notes: null,
  outline_summary: null,
  outline_ready: false,
};

type ChatMode = (typeof CHAT_MODES)[number];

function normalizeWorkMode(mode: string): ChatMode {
  if (mode === "outline") return "creation";
  if (mode === "advice") return "ask";
  if (mode === "inspiration" || mode === "creation" || mode === "ask") {
    return mode;
  }
  return "inspiration";
}

const EMPTY_WORK_INSPIRATION = {
  confirmed_requirements: [],
  summary: null,
  inspiration_ready: false,
  summarized_at: null,
};

function toWorkDTO(work: Work): WorkDTO {
  return {
    id: work.id,
    title: work.title,
    groupId: work.groupId,
    profile: (work.profile as WorkDTO["profile"]) ?? EMPTY_WORK_PROFILE,
    outline: (work.outline as WorkDTO["outline"]) ?? EMPTY_WORK_OUTLINE,
    inspiration:
      (work.inspiration as WorkDTO["inspiration"]) ?? EMPTY_WORK_INSPIRATION,
    creation: (work.creation as WorkDTO["creation"]) ?? null,
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

  const work = await prisma.work.create({
    data: {
      userId,
      groupId: groupId ?? null,
      title: title?.trim() || "未命名作品",
      profile: EMPTY_WORK_PROFILE,
      outline: EMPTY_WORK_OUTLINE,
      inspiration: EMPTY_WORK_INSPIRATION,
      conversations: {
        create: {
          title: "对话 1",
          mode: "inspiration",
        },
      },
    },
  });
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
    inspiration: unknown;
    creation: unknown | null;
  }>,
) {
  const existing = await prisma.work.findFirst({ where: { id: workId, userId } });
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
  if (data.inspiration !== undefined) {
    updateData.inspiration = data.inspiration as Prisma.InputJsonValue;
  }
  if (data.creation !== undefined) {
    updateData.creation =
      data.creation === null
        ? Prisma.JsonNull
        : (data.creation as Prisma.InputJsonValue);
  }

  const work = await prisma.work.update({
    where: { id: workId },
    data: updateData,
  });
  return toWorkDTO(work);
}

export async function deleteWork(userId: string, workId: string) {
  const existing = await prisma.work.findFirst({ where: { id: workId, userId } });
  if (!existing) return false;
  await prisma.work.delete({ where: { id: workId } });
  return true;
}

export async function getAgentContext(
  userId: string,
  workId: string,
  conversationId?: string,
) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  let mode = "inspiration" as ReturnType<typeof normalizeWorkMode>;
  let threadId: string | null = null;
  let resolvedConversationId: string | undefined;

  if (conversationId) {
    const conversation = await prisma.workConversation.findFirst({
      where: { id: conversationId, workId },
    });
    if (conversation) {
      mode = normalizeWorkMode(conversation.mode);
      threadId = conversation.threadId;
      resolvedConversationId = conversation.id;
    }
  }

  return {
    workId: work.id,
    conversationId: resolvedConversationId,
    mode,
    profile: work.profile,
    outline: work.outline,
    inspiration: work.inspiration,
    creation: work.creation,
    threadId,
    title: work.title,
  };
}
