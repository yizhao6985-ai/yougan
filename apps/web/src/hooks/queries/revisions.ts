import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

import { queryKeys } from "@/hooks/queries/keys";
import { patchWorksCache } from "@/hooks/queries/works";
import { normalizeWork } from "@/lib/normalize-work";
import {
  duplicateWork,
  listWorkRevisions,
  restoreWorkRevision,
} from "@/services/work-history";
import { useAuthToken } from "@/store/auth";

export function useWorkRevisionsQuery(workId: string | null) {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.works.revisions(workId ?? ""),
    queryFn: async () => {
      const { revisions } = await listWorkRevisions(workId!);
      return revisions;
    },
    enabled: Boolean(token && workId),
  });
}

export function useRestoreWorkRevisionMutation(workId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (revisionId: string) => {
      if (!workId) throw new Error("No active work");
      return restoreWorkRevision(workId, revisionId);
    },
    onSuccess: ({ work }) => {
      if (!workId) return;
      patchWorksCache(queryClient, (works) =>
        works.map((item) =>
          item.id === workId ? normalizeWork(work) : item,
        ),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.works.revisions(workId),
      });
    },
  });
}

export function useDuplicateWorkMutation(sourceWorkId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: {
      title?: string;
      groupId?: string | null;
      revisionId?: string;
    }) => {
      if (!sourceWorkId) throw new Error("No active work");
      return duplicateWork(sourceWorkId, options);
    },
    onSuccess: ({ work }) => {
      patchWorksCache(queryClient, (works) => [
        normalizeWork(work),
        ...works,
      ]);
    },
  });
}

export function useInvalidateRevisionQueries(workId: string | null) {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    if (!workId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.works.revisions(workId),
    });
  }, [queryClient, workId]);
}
