import { useCallback, useMemo } from "react";
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
  clearProfileBeats,
  clearProfileConstraints,
  deleteProfileBeat,
  deleteProfileConstraint,
  mergeProfileForDisplay,
  updateProfileBeat,
  updateProfileConstraint,
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

  const applyStreamValuesToCache = useCallback(
    (workId: string, values: YouganValues) => {
      if (values.turnCommitted !== true || values.turnCancelled === true) return;

      const patch: Partial<Work> = {};
      if (values.profile !== undefined) patch.profile = values.profile;
      if (values.preview !== undefined) patch.preview = values.preview;
      if (!Object.keys(patch).length) return;

      patchWorksCache(queryClient, (works) =>
        works.map((work) =>
          work.id === workId ? normalizeWork({ ...work, ...patch }) : work,
        ),
      );
    },
    [queryClient],
  );

  const patchProfile = useCallback(
    (workId: string, profile: WorkProfile) => {
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
    },
    [queryClient, updateWorkMutation],
  );

  const updateProfileConstraintItem = useCallback(
    (workId: string, constraintId: string, description: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = updateProfileConstraint(
        current.profile,
        constraintId,
        description,
      );
      patchProfile(workId, next);
    },
    [patchProfile, queryClient],
  );

  const deleteProfileConstraintItem = useCallback(
    (workId: string, constraintId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = deleteProfileConstraint(current.profile, constraintId);
      patchProfile(workId, next);
    },
    [patchProfile, queryClient],
  );

  const clearWorkProfileConstraints = useCallback(
    (workId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      patchProfile(workId, clearProfileConstraints(current.profile));
    },
    [patchProfile, queryClient],
  );

  const updateProfileBeatItem = useCallback(
    (workId: string, beatId: string, description: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = updateProfileBeat(current.profile, beatId, description);
      patchProfile(workId, next);
    },
    [patchProfile, queryClient],
  );

  const deleteProfileBeatItem = useCallback(
    (workId: string, beatId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = deleteProfileBeat(current.profile, beatId);
      patchProfile(workId, next);
    },
    [patchProfile, queryClient],
  );

  const clearWorkProfileBeats = useCallback(
    (workId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      patchProfile(workId, clearProfileBeats(current.profile));
    },
    [patchProfile, queryClient],
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
    applyStreamValuesToCache,
    updateProfileConstraint: updateProfileConstraintItem,
    deleteProfileConstraint: deleteProfileConstraintItem,
    clearWorkProfileConstraints,
    updateProfileBeat: updateProfileBeatItem,
    deleteProfileBeat: deleteProfileBeatItem,
    clearWorkProfileBeats,
    renameWork,
    moveWorkToGroup,
    mergeProfileForDisplay,
  };
}

export type WorksStore = ReturnType<typeof useWorksStore>;
