import type { WorkGroup } from "../db.js";

import { prisma } from "../db.js";
import type { WorkGroupDTO } from "../schemas.js";

function toWorkGroupDTO(group: WorkGroup): WorkGroupDTO {
  return {
    id: group.id,
    title: group.title,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export async function listWorkGroups(userId: string) {
  const groups = await prisma.workGroup.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return groups.map(toWorkGroupDTO);
}

export async function createWorkGroup(userId: string, title?: string) {
  const group = await prisma.workGroup.create({
    data: {
      userId,
      title: title?.trim() || "未命名分组",
    },
  });
  return toWorkGroupDTO(group);
}

export async function getWorkGroup(userId: string, groupId: string) {
  const group = await prisma.workGroup.findFirst({
    where: { id: groupId, userId },
  });
  if (!group) return null;
  return toWorkGroupDTO(group);
}

export async function updateWorkGroup(
  userId: string,
  groupId: string,
  data: { title?: string },
) {
  const existing = await prisma.workGroup.findFirst({
    where: { id: groupId, userId },
  });
  if (!existing) return null;

  const group = await prisma.workGroup.update({
    where: { id: groupId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() || existing.title } : {}),
    },
  });
  return toWorkGroupDTO(group);
}

export async function deleteWorkGroup(userId: string, groupId: string) {
  const existing = await prisma.workGroup.findFirst({
    where: { id: groupId, userId },
  });
  if (!existing) return false;
  await prisma.workGroup.delete({ where: { id: groupId } });
  return true;
}
