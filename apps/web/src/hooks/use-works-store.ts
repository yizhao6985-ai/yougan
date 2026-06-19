import { useMemoizedFn } from "ahooks";
import { useMemo } from "react";
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
  useWorksQuery,
  useWorkGroupsQuery,
} from "@/hooks/queries/works";
import { queryKeys } from "@/hooks/queries/keys";
import { normalizeWork } from "@/lib/normalize-work";
import {
  clearBounds,
  clearContext,
  clearSequence,
  deleteBoundItem,
  deleteContextItem,
  deleteSequenceItem,
  updateBoundItem,
  updateContextItem,
  updateSequenceItem,
} from "@yougan/domain";
import type { YouganValues, Work, WorkProfile } from "@/lib/types";
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

  const resolvedActiveWorkId = useMemo(() => {
    if (!token || !works.length) return null;
    if (activeWorkId && works.some((work) => work.id === activeWorkId)) {
      return activeWorkId;
    }
    return works[0]?.id ?? null;
  }, [activeWorkId, token, works]);

  const activeWork = useMemo(
    () => works.find((work) => work.id === resolvedActiveWorkId) ?? null,
    [resolvedActiveWorkId, works],
  );

  const reload = useMemoizedFn(async () => {
    invalidateWorksQueries();
  });

  const createWork = useMemoizedFn(async (title?: string, groupId?: string | null) => {
    const { work } = await createWorkMutation.mutateAsync({ title, groupId });
    const normalized = normalizeWork(work);
    setActiveWorkId(normalized.id);
    return normalized;
  });

  const createGroup = useMemoizedFn(async (title?: string) => {
    const { group } = await createGroupMutation.mutateAsync(title);
    return group;
  });

  const renameGroup = useMemoizedFn(async (groupId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await updateGroupMutation.mutateAsync({ groupId, title: trimmed });
  });

  const deleteGroup = useMemoizedFn(async (groupId: string) => {
    await deleteGroupMutation.mutateAsync(groupId);
  });

  const deleteWork = useMemoizedFn(async (workId: string) => {
    await deleteWorkMutation.mutateAsync(workId);
    setActiveWorkId((current) => (current === workId ? null : current));
  });

  const selectWork = useMemoizedFn((workId: string) => {
    setActiveWorkId(workId);
  });

  const applyStreamValuesToCache = useMemoizedFn(
    (workId: string, values: YouganValues) => {
      if (values.turn?.committed !== true || values.turn?.cancelled === true)
        return;

      const patch: Partial<Work> = {};
      if (values.profile !== undefined) patch.profile = values.profile;
      if (values.references !== undefined) patch.references = values.references;
      if (values.production !== undefined) patch.production = values.production;
      if (!Object.keys(patch).length) return;

      patchWorksCache(queryClient, (works) =>
        works.map((work) =>
          work.id === workId ? normalizeWork({ ...work, ...patch }) : work,
        ),
      );
    },
  );

  const patchProfile = useMemoizedFn((workId: string, profile: WorkProfile) => {
    patchWorksCache(queryClient, (works) =>
      works.map((work) =>
        work.id === workId ? { ...work, profile } : work,
      ),
    );
    void updateWorkMutation
      .mutateAsync({ workId, patch: { profile } })
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.works.list });
      });
  });

  const updateProfileBound = useMemoizedFn(
    (workId: string, itemId: string, spec: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = updateBoundItem(current.profile, itemId, spec);
      patchProfile(workId, next);
    },
  );

  const deleteProfileBound = useMemoizedFn((workId: string, itemId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    const next = deleteBoundItem(current.profile, itemId);
    patchProfile(workId, next);
  });

  const clearWorkProfileBounds = useMemoizedFn((workId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    patchProfile(workId, clearBounds(current.profile));
  });

  const updateProfileSequence = useMemoizedFn(
    (workId: string, itemId: string, spec: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = updateSequenceItem(current.profile, itemId, spec);
      patchProfile(workId, next);
    },
  );

  const deleteProfileSequence = useMemoizedFn((workId: string, itemId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    const next = deleteSequenceItem(current.profile, itemId);
    patchProfile(workId, next);
  });

  const clearWorkProfileSequence = useMemoizedFn((workId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    patchProfile(workId, clearSequence(current.profile));
  });

  const updateProfileContext = useMemoizedFn(
    (workId: string, itemId: string, spec: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = updateContextItem(current.profile, itemId, spec);
      patchProfile(workId, next);
    },
  );

  const deleteProfileContext = useMemoizedFn((workId: string, itemId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    const next = deleteContextItem(current.profile, itemId);
    patchProfile(workId, next);
  });

  const clearWorkProfileContext = useMemoizedFn((workId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    patchProfile(workId, clearContext(current.profile));
  });

  const renameWork = useMemoizedFn(async (workId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await updateWorkMutation.mutateAsync({
      workId,
      patch: { title: trimmed },
    });
  });

  const moveWorkToGroup = useMemoizedFn(
    async (workId: string, groupId: string | null) => {
      await updateWorkMutation.mutateAsync({ workId, patch: { groupId } });
    },
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
    applyStreamValuesToCache,
    updateProfileBound,
    deleteProfileBound,
    clearWorkProfileBounds,
    updateProfileSequence,
    deleteProfileSequence,
    clearWorkProfileSequence,
    updateProfileContext,
    deleteProfileContext,
    clearWorkProfileContext,
    renameWork,
    moveWorkToGroup,
  };
}

export type WorksStore = ReturnType<typeof useWorksStore>;
