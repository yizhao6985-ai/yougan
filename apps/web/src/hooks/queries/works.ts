import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemoizedFn } from "ahooks";

import { queryKeys } from "@/hooks/queries/keys";
import { normalizeWork } from "@/lib/normalize-work";
import type { Work, WorkGroup } from "@/lib/types";
import {
  createWorkGroup as apiCreateWorkGroup,
  deleteWorkGroup as apiDeleteWorkGroup,
  listWorkGroups,
  updateWorkGroup as apiUpdateWorkGroup,
} from "@/services/work-groups";
import {
  createWork as apiCreateWork,
  deleteWork as apiDeleteWork,
  listWorks,
  updateWork as apiUpdateWork,
} from "@/services/works";
import { useAuthToken } from "@/store/auth";

export function useWorksQuery() {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.works.list,
    queryFn: async () => {
      const { works } = await listWorks();
      return works.map(normalizeWork);
    },
    enabled: Boolean(token),
  });
}

export function useWorkGroupsQuery() {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.workGroups.list,
    queryFn: async () => {
      const { groups } = await listWorkGroups();
      return groups;
    },
    enabled: Boolean(token),
  });
}

export function patchWorksCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (works: Work[]) => Work[],
) {
  queryClient.setQueryData<Work[]>(queryKeys.works.list, (current) =>
    updater(current ?? []),
  );
}

function patchGroupsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (groups: WorkGroup[]) => WorkGroup[],
) {
  queryClient.setQueryData<WorkGroup[]>(
    queryKeys.workGroups.list,
    (current) => updater(current ?? []),
  );
}

export function useCreateWorkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      groupId,
    }: {
      title?: string;
      groupId?: string | null;
    }) => apiCreateWork(title, groupId),
    onSuccess: ({ work }) => {
      const normalized = normalizeWork(work);
      patchWorksCache(queryClient, (works) => [normalized, ...works]);
    },
  });
}

export function useCreateWorkGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => apiCreateWorkGroup(title),
    onSuccess: ({ group }) => {
      patchGroupsCache(queryClient, (groups) => [group, ...groups]);
    },
  });
}

export function useUpdateWorkGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, title }: { groupId: string; title: string }) =>
      apiUpdateWorkGroup(groupId, { title }),
    onSuccess: ({ group }) => {
      patchGroupsCache(queryClient, (groups) =>
        groups.map((item) => (item.id === group.id ? group : item)),
      );
    },
  });
}

export function useDeleteWorkGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => apiDeleteWorkGroup(groupId),
    onSuccess: (_, groupId) => {
      patchGroupsCache(queryClient, (groups) =>
        groups.filter((group) => group.id !== groupId),
      );
      patchWorksCache(queryClient, (works) =>
        works.map((work) =>
          work.groupId === groupId ? { ...work, groupId: null } : work,
        ),
      );
    },
  });
}

export function useDeleteWorkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workId: string) => apiDeleteWork(workId),
    onSuccess: (_, workId) => {
      patchWorksCache(queryClient, (works) =>
        works.filter((work) => work.id !== workId),
      );
    },
  });
}

export function useUpdateWorkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workId,
      patch,
    }: {
      workId: string;
      patch: Parameters<typeof apiUpdateWork>[1];
    }) => apiUpdateWork(workId, patch),
    onSuccess: ({ work }) => {
      const normalized = normalizeWork(work);
      patchWorksCache(queryClient, (works) =>
        works.map((item) => (item.id === normalized.id ? normalized : item)),
      );
    },
  });
}

export function useInvalidateWorksQueries() {
  const queryClient = useQueryClient();

  return useMemoizedFn(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.works.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workGroups.all }),
    ]);
  });
}
