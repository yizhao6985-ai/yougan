import { apiFetch } from "@/services/client";
import type {
  Work,
  WorkRevisionDTO,
  WorkRevisionSnapshot,
} from "@/lib/types";

export interface WorkAgentContext {
  workId: string;
  conversationId?: string;
  headRevisionId?: string | null;
  profile: Work["profile"];
  brief: Work["brief"];
  outline: Work["outline"];
  plan: Work["plan"];
  draft: Work["draft"];
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

export async function listWorkRevisions(workId: string) {
  return apiFetch<{ revisions: WorkRevisionDTO[] }>(
    `/api/works/${workId}/revisions`,
  );
}

export async function restoreWorkRevision(workId: string, revisionId: string) {
  return apiFetch<{ revision: WorkRevisionDTO; work: Work }>(
    `/api/works/${workId}/restore/${revisionId}`,
    { method: "POST" },
  );
}

export async function duplicateWork(
  workId: string,
  options?: {
    title?: string;
    groupId?: string | null;
    revisionId?: string;
  },
) {
  return apiFetch<{ work: Work }>(`/api/works/${workId}/duplicate`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

export type { WorkRevisionSnapshot };
