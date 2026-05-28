import { apiFetch } from "@/services/client";
import type { WorkGroup } from "@/lib/types";

export async function listWorkGroups() {
  return apiFetch<{ groups: WorkGroup[] }>("/api/work-groups");
}

export async function createWorkGroup(title?: string) {
  return apiFetch<{ group: WorkGroup }>("/api/work-groups", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function updateWorkGroup(groupId: string, patch: { title?: string }) {
  return apiFetch<{ group: WorkGroup }>(`/api/work-groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteWorkGroup(groupId: string) {
  await apiFetch<void>(`/api/work-groups/${groupId}`, { method: "DELETE" });
}
