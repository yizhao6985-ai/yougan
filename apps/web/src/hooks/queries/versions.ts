import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemoizedFn } from "ahooks";

import { queryKeys } from "@/hooks/queries/keys";
import { patchWorksCache } from "@/hooks/queries/works";
import { normalizeWork } from "@/lib/normalize-work";
import {
  duplicateWork,
  listWorkVersions,
  restoreWorkVersion,
} from "@/services/work-history";
import { useAuthToken } from "@/store/auth";

export function useWorkVersionsQuery(workId: string | null) {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.works.versions(workId ?? ""),
    queryFn: async () => {
      const { versions } = await listWorkVersions(workId!);
      return versions;
    },
    enabled: Boolean(token && workId),
  });
}

export function useRestoreWorkVersionMutation(workId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => {
      if (!workId) throw new Error("No active work");
      return restoreWorkVersion(workId, versionId);
    },
    onSuccess: ({ work }) => {
      if (!workId) return;
      patchWorksCache(queryClient, (works) =>
        works.map((item) =>
          item.id === workId ? normalizeWork(work) : item,
        ),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.works.versions(workId),
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
      versionId?: string;
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

export function useInvalidateVersionQueries(workId: string | null) {
  const queryClient = useQueryClient();

  return useMemoizedFn(async () => {
    if (!workId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.works.versions(workId),
    });
  });
}
