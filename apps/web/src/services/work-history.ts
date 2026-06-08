import { apiFetch } from "@/services/client";
import type { Work, WorkVersion, WorkWire } from "@/services/types";

export interface WorkAgentContext {
  workId: string;
  conversationId?: string;
  headVersionId?: string | null;
  profile: Work["profile"];
  productionPlan: Work["productionPlan"];
  preview: Work["preview"];
  threadId?: string | null;
  workTitle?: string;
  conversationTitle?: string;
}

export async function getWorkAgentContext(
  workId: string,
  conversationId?: string,
) {
  const query = conversationId
    ? `?conversationId=${encodeURIComponent(conversationId)}`
    : "";
  return apiFetch<{ context: WorkAgentContext }>(
    `/api/works/${workId}/agent-context${query}`,
  );
}

export async function listWorkVersions(workId: string) {
  return apiFetch<{ versions: WorkVersion[] }>(
    `/api/works/${workId}/versions`,
  );
}

export async function restoreWorkVersion(workId: string, versionId: string) {
  return apiFetch<{ version: WorkVersion; work: WorkWire }>(
    `/api/works/${workId}/restore/${versionId}`,
    { method: "POST" },
  );
}

export async function duplicateWork(
  workId: string,
  options?: {
    title?: string;
    groupId?: string | null;
    versionId?: string;
  },
) {
  return apiFetch<{ work: WorkWire }>(`/api/works/${workId}/duplicate`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

export type { WorkVersionSnapshot } from "@/services/types";
