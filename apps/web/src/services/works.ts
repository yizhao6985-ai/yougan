import { apiFetch } from "@/services/client";
import type { WorkWire } from "@/services/types";
import type { Work } from "@/lib/types";

export async function listWorks() {
  return apiFetch<{ works: WorkWire[] }>("/api/works");
}

export async function createWork(title?: string, groupId?: string | null) {
  return apiFetch<{ work: WorkWire }>("/api/works", {
    method: "POST",
    body: JSON.stringify({ title, groupId: groupId ?? undefined }),
  });
}

export async function updateWork(
  workId: string,
  patch: Partial<Work> & {
    profile?: Work["profile"];
    production?: Work["production"];
  },
) {
  return apiFetch<{ work: WorkWire }>(`/api/works/${workId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteWork(workId: string) {
  await apiFetch<void>(`/api/works/${workId}`, { method: "DELETE" });
}
