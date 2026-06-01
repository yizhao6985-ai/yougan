import { useCallback, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";

import {
  patchWorksCache,
  useCreateWorkGroupMutation,
  useCreateWorkMutation,
  useDeleteWorkGroupMutation,
  useDeleteWorkMutation,
  useInvalidateWorksQueries,
  useUpdateWorkGroupMutation,
  useUpdateWorkMutation,
  useWorkGroupsQuery,
  useWorksQuery,
} from "@/hooks/queries/works";
import { queryKeys } from "@/hooks/queries/keys";
import { normalizeWork } from "@/lib/normalize-work";
import {
  clearInspirations,
  deleteInspirationRequirement as removeInspirationRequirement,
  mergeInspirationState,
  updateInspirationRequirement as replaceInspirationRequirement,
} from "@/lib/inspiration-merge";
import type { YouganValues, Work, WorkInspiration } from "@/lib/types";
import { EMPTY_WORK_OUTLINE } from "@/lib/types";
import { useAuthToken } from "@/store/auth";
import { activeWorkIdAtom } from "@/store/studio";

export function useWorksStore() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [activeWorkId, setActiveWorkId] = useAtom(activeWorkIdAtom);
  const worksQuery = useWorksQuery();
  const groupsQuery = useWorkGroupsQuery();
  const invalidateWorksQueries = useInvalidateWorksQueries();

  const createWorkMutation = useCreateWorkMutation();
  const createGroupMutation = useCreateWorkGroupMutation();
  const updateGroupMutation = useUpdateWorkGroupMutation();
  const deleteGroupMutation = useDeleteWorkGroupMutation();
  const deleteWorkMutation = useDeleteWorkMutation();
  const updateWorkMutation = useUpdateWorkMutation();

  const works = worksQuery.data ?? [];
  const groups = groupsQuery.data ?? [];
  const loading =
    Boolean(token) && (worksQuery.isLoading || groupsQuery.isLoading);
  const error =
    worksQuery.error instanceof Error
      ? worksQuery.error.message
      : groupsQuery.error instanceof Error
        ? groupsQuery.error.message
        : worksQuery.error || groupsQuery.error
          ? "加载作品失败"
          : null;

  useEffect(() => {
    if (!token) {
      setActiveWorkId(null);
      return;
    }
    if (!works.length) {
      setActiveWorkId(null);
      return;
    }
    setActiveWorkId((prev) => {
      if (prev && works.some((work) => work.id === prev)) return prev;
      return works[0]?.id ?? null;
    });
  }, [token, works, setActiveWorkId]);

  const activeWork = useMemo(
    () => works.find((work) => work.id === activeWorkId) ?? null,
    [activeWorkId, works],
  );

  const reload = useCallback(async () => {
    invalidateWorksQueries();
  }, [invalidateWorksQueries]);

  const createWork = useCallback(
    async (title?: string, groupId?: string | null) => {
      const { work } = await createWorkMutation.mutateAsync({ title, groupId });
      const normalized = normalizeWork(work);
      setActiveWorkId(normalized.id);
      return normalized;
    },
    [createWorkMutation, setActiveWorkId],
  );

  const createGroup = useCallback(
    async (title?: string) => {
      const { group } = await createGroupMutation.mutateAsync(title);
      return group;
    },
    [createGroupMutation],
  );

  const renameGroup = useCallback(
    async (groupId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      await updateGroupMutation.mutateAsync({ groupId, title: trimmed });
    },
    [updateGroupMutation],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      await deleteGroupMutation.mutateAsync(groupId);
    },
    [deleteGroupMutation],
  );

  const deleteWork = useCallback(
    async (workId: string) => {
      await deleteWorkMutation.mutateAsync(workId);
      setActiveWorkId((current) => (current === workId ? null : current));
    },
    [deleteWorkMutation, setActiveWorkId],
  );

  const selectWork = useCallback(
    (workId: string) => {
      setActiveWorkId(workId);
    },
    [setActiveWorkId],
  );

  const syncFromStream = useCallback(
    async (workId: string, values: YouganValues) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);

      const mergedInspiration =
        values.inspiration !== undefined
          ? mergeInspirationState(current?.inspiration, values.inspiration)
          : undefined;

      const patch: Partial<Work> = {};
      if (values.profile !== undefined) patch.profile = values.profile;
      const streamPlan = values.plan ?? values.outline;
      if (streamPlan !== undefined) {
        patch.outline = {
          ...(current?.outline ?? EMPTY_WORK_OUTLINE),
          ...streamPlan,
        };
      }
      if (mergedInspiration !== undefined) patch.inspiration = mergedInspiration;
      if (values.creation !== undefined) patch.creation = values.creation;
      if (!Object.keys(patch).length) return;

      patchWorksCache(queryClient, (works) =>
        works.map((work) =>
          work.id === workId ? normalizeWork({ ...work, ...patch }) : work,
        ),
      );

      await updateWorkMutation.mutateAsync({ workId, patch });
    },
    [queryClient, updateWorkMutation],
  );

  const patchInspiration = useCallback(
    (workId: string, inspiration: WorkInspiration) => {
      patchWorksCache(queryClient, (works) =>
        works.map((work) =>
          work.id === workId ? { ...work, inspiration } : work,
        ),
      );
      void updateWorkMutation
        .mutateAsync({ workId, patch: { inspiration } })
        .catch(() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.works.list });
        });
    },
    [queryClient, updateWorkMutation],
  );

  const updateInspirationRequirement = useCallback(
    (workId: string, requirementId: string, description: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = replaceInspirationRequirement(
        current.inspiration,
        requirementId,
        description,
      );
      patchInspiration(workId, next);
    },
    [patchInspiration, queryClient],
  );

  const deleteInspirationRequirement = useCallback(
    (workId: string, requirementId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = removeInspirationRequirement(
        current.inspiration,
        requirementId,
      );
      patchInspiration(workId, next);
    },
    [patchInspiration, queryClient],
  );

  const clearWorkInspirations = useCallback(
    (workId: string) => {
      patchInspiration(workId, clearInspirations(undefined));
    },
    [patchInspiration],
  );

  const renameWork = useCallback(
    async (workId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      await updateWorkMutation.mutateAsync({
        workId,
        patch: { title: trimmed },
      });
    },
    [updateWorkMutation],
  );

  const moveWorkToGroup = useCallback(
    async (workId: string, groupId: string | null) => {
      await updateWorkMutation.mutateAsync({ workId, patch: { groupId } });
    },
    [updateWorkMutation],
  );

  return {
    works,
    groups,
    activeWork,
    loading,
    error,
    reload,
    createWork,
    createGroup,
    renameGroup,
    deleteGroup,
    deleteWork,
    selectWork,
    syncFromStream,
    updateInspirationRequirement,
    deleteInspirationRequirement,
    clearWorkInspirations,
    renameWork,
    moveWorkToGroup,
  };
}

export type WorksStore = ReturnType<typeof useWorksStore>;
