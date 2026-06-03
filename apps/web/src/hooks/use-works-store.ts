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
  useWorkGroupsQuery,
  useWorksQuery,
} from "@/hooks/queries/works";
import { queryKeys } from "@/hooks/queries/keys";
import { normalizeWork } from "@/lib/normalize-work";
import {
  clearBrief,
  deleteBriefRequirement as removeBriefRequirement,
  updateBriefRequirement as replaceBriefRequirement,
} from "@/lib/brief-merge";
import {
  clearOutline,
  deleteOutlineSection as removeOutlineSection,
  updateOutlineSection as replaceOutlineSection,
} from "@/lib/outline-merge";
import type { YouganValues, Work, WorkBrief, WorkOutline } from "@/lib/types";
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
      const patch: Partial<Work> = {};
      if (values.profile !== undefined) patch.profile = values.profile;
      if (values.outline !== undefined) patch.outline = values.outline;
      if (values.brief !== undefined) patch.brief = values.brief;
      if (values.draft !== undefined) patch.draft = values.draft;
      if (!Object.keys(patch).length) return;

      patchWorksCache(queryClient, (works) =>
        works.map((work) =>
          work.id === workId ? normalizeWork({ ...work, ...patch }) : work,
        ),
      );
    },
    [queryClient],
  );

  const patchBrief = useCallback(
    (workId: string, brief: WorkBrief) => {
      patchWorksCache(queryClient, (works) =>
        works.map((work) => (work.id === workId ? { ...work, brief } : work)),
      );
      void updateWorkMutation
        .mutateAsync({ workId, patch: { brief } })
        .catch(() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.works.list });
        });
    },
    [queryClient, updateWorkMutation],
  );

  const patchOutline = useCallback(
    (workId: string, outline: WorkOutline) => {
      patchWorksCache(queryClient, (works) =>
        works.map((work) => (work.id === workId ? { ...work, outline } : work)),
      );
      void updateWorkMutation
        .mutateAsync({ workId, patch: { outline } })
        .catch(() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.works.list });
        });
    },
    [queryClient, updateWorkMutation],
  );

  const updateBriefRequirement = useCallback(
    (workId: string, requirementId: string, description: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = replaceBriefRequirement(
        current.brief,
        requirementId,
        description,
      );
      patchBrief(workId, next);
    },
    [patchBrief, queryClient],
  );

  const deleteBriefRequirement = useCallback(
    (workId: string, requirementId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = removeBriefRequirement(current.brief, requirementId);
      patchBrief(workId, next);
    },
    [patchBrief, queryClient],
  );

  const clearWorkBrief = useCallback(
    (workId: string) => {
      patchBrief(workId, clearBrief(undefined));
    },
    [patchBrief],
  );

  const updateOutlineSection = useCallback(
    (workId: string, sectionId: string, description: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = replaceOutlineSection(
        current.outline,
        sectionId,
        description,
      );
      patchOutline(workId, next);
    },
    [patchOutline, queryClient],
  );

  const deleteOutlineSection = useCallback(
    (workId: string, sectionId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = removeOutlineSection(current.outline, sectionId);
      patchOutline(workId, next);
    },
    [patchOutline, queryClient],
  );

  const clearWorkOutline = useCallback(
    (workId: string) => {
      patchOutline(workId, clearOutline(undefined));
    },
    [patchOutline],
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
    updateBriefRequirement,
    deleteBriefRequirement,
    clearWorkBrief,
    updateOutlineSection,
    deleteOutlineSection,
    clearWorkOutline,
    renameWork,
    moveWorkToGroup,
  };
}

export type WorksStore = ReturnType<typeof useWorksStore>;
