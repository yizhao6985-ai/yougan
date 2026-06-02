import { apiFetch } from "@/services/client";
import type { WorkConversation } from "@/lib/types";

export async function listWorkConversations(workId: string) {
  return apiFetch<{ conversations: WorkConversation[] }>(
    `/api/works/${workId}/conversations`,
  );
}

export async function createWorkConversation(
  workId: string,
  options?: { title?: string },
) {
  return apiFetch<{ conversation: WorkConversation }>(
    `/api/works/${workId}/conversations`,
    {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    },
  );
}

export async function updateWorkConversation(
  workId: string,
  conversationId: string,
  patch: Partial<Pick<WorkConversation, "title" | "mode" | "threadId">>,
) {
  return apiFetch<{ conversation: WorkConversation }>(
    `/api/works/${workId}/conversations/${conversationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
}

export async function deleteWorkConversation(
  workId: string,
  conversationId: string,
) {
  await apiFetch<void>(
    `/api/works/${workId}/conversations/${conversationId}`,
    { method: "DELETE" },
  );
}
