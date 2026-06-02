import { apiFetch } from "@/services/client";
import type { Work } from "@/lib/types";

export async function listWorks() {
  return apiFetch<{ works: Work[] }>("/api/works");
}

export async function createWork(title?: string, groupId?: string | null) {
  return apiFetch<{ work: Work }>("/api/works", {
    method: "POST",
    body: JSON.stringify({ title, groupId: groupId ?? undefined }),
  });
}

export async function updateWork(
  workId: string,
  patch: Partial<Work> & {
    profile?: Work["profile"];
    outline?: Work["outline"];
    plan?: Work["plan"];
    brief?: Work["brief"];
    draft?: Work["draft"];
  },
) {
  return apiFetch<{ work: Work }>(`/api/works/${workId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteWork(workId: string) {
  await apiFetch<void>(`/api/works/${workId}`, { method: "DELETE" });
}

export async function uploadReference(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<{ url: string; key: string }>("/api/upload", {
    method: "POST",
    body,
  });
}
