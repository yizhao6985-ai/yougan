import { apiFetch } from "@/services/client";
import type { WorkWire } from "@/services/types";
import type { Asset, Work } from "@/lib/types";

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
    productionPlan?: Work["productionPlan"];
    preview?: Work["preview"];
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

export async function uploadReference(file: File): Promise<Asset> {
  const body = new FormData();
  body.append("file", file);
  body.append("purpose", "reference");
  const data = await apiFetch<{
    asset: Asset;
    url: string;
    key: string;
  }>("/api/upload", {
    method: "POST",
    body,
  });
  return data.asset ?? {
    key: data.key,
    url: data.url,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    original_name: file.name,
  };
}
