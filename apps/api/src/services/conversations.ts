import type { WorkConversation } from "@prisma/client";

import { prisma } from "../db.js";
import type { WorkConversationDTO } from "../schemas.js";
import { getWork } from "./works.js";

function normalizeConversationMode(mode: string): WorkConversationDTO["mode"] {
  if (mode === "outline") return "creation";
  if (mode === "advice") return "ask";
  if (mode === "inspiration" || mode === "creation" || mode === "ask") {
    return mode;
  }
  return "inspiration";
}

function toConversationDTO(
  conversation: WorkConversation,
): WorkConversationDTO {
  return {
    id: conversation.id,
    workId: conversation.workId,
    title: conversation.title,
    mode: normalizeConversationMode(conversation.mode),
    threadId: conversation.threadId,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

export async function listWorkConversations(userId: string, workId: string) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  let conversations = await prisma.workConversation.findMany({
    where: { workId },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversations.length) {
    const created = await prisma.workConversation.create({
      data: {
        workId,
        title: "对话 1",
        mode: "inspiration",
      },
    });
    conversations = [created];
  }

  return conversations.map(toConversationDTO);
}

export async function createWorkConversation(
  userId: string,
  workId: string,
  options?: { title?: string; mode?: string },
) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  const count = await prisma.workConversation.count({ where: { workId } });
  const title = options?.title?.trim() || `对话 ${count + 1}`;
  const mode = options?.mode ?? "inspiration";

  const conversation = await prisma.workConversation.create({
    data: {
      workId,
      title,
      mode,
    },
  });
  return toConversationDTO(conversation);
}

export async function getWorkConversation(
  userId: string,
  workId: string,
  conversationId: string,
) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  const conversation = await prisma.workConversation.findFirst({
    where: { id: conversationId, workId },
  });
  if (!conversation) return null;
  return toConversationDTO(conversation);
}

export async function updateWorkConversation(
  userId: string,
  workId: string,
  conversationId: string,
  data: Partial<{
    title: string;
    mode: string;
    threadId: string | null;
  }>,
) {
  const existing = await getWorkConversation(userId, workId, conversationId);
  if (!existing) return null;

  const conversation = await prisma.workConversation.update({
    where: { id: conversationId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.mode !== undefined ? { mode: data.mode } : {}),
      ...(data.threadId !== undefined ? { threadId: data.threadId } : {}),
    },
  });
  return toConversationDTO(conversation);
}

export async function deleteWorkConversation(
  userId: string,
  workId: string,
  conversationId: string,
) {
  const existing = await getWorkConversation(userId, workId, conversationId);
  if (!existing) return false;

  await prisma.workConversation.delete({ where: { id: conversationId } });
  return true;
}

export async function ensureDefaultConversation(userId: string, workId: string) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  const existing = await prisma.workConversation.findFirst({
    where: { workId },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return toConversationDTO(existing);

  return createWorkConversation(userId, workId, { title: "对话 1" });
}
