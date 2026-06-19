import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemoizedFn } from "ahooks";

import { queryKeys } from "@/hooks/queries/keys";
import { patchWorksCache } from "@/hooks/queries/works";
import { normalizeWork } from "@/lib/normalize-work";
import type { Work, WorkVersion } from "@/lib/types";
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

export function useRestoreWorkVersionMutation(
  workId: string | null,
  options?: {
    onRestored?: (work: Work) => void | Promise<void>;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => {
      if (!workId) throw new Error("No active work");
      return restoreWorkVersion(workId, versionId);
    },
    onSuccess: async ({ work }) => {
      if (!workId) return;
      const normalized = normalizeWork(work);
      patchWorksCache(queryClient, (works) =>
        works.map((item) =>
          item.id === workId ? normalized : item,
        ),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.works.versions(workId),
      });
      await options?.onRestored?.(normalized);
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
    await queryClient.refetchQueries({
      queryKey: queryKeys.works.versions(workId),
    });
    const versions = queryClient.getQueryData<WorkVersion[]>(
      queryKeys.works.versions(workId),
    );
    const headId = versions?.[0]?.id;
    if (!headId) return;
    patchWorksCache(queryClient, (works) =>
      works.map((work) =>
        work.id === workId ? { ...work, headVersionId: headId } : work,
      ),
    );
  });
}
