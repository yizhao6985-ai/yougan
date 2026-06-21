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
  clearRequirements,
  clearSetting,
  deleteBoundItem,
  deleteRequirementItem,
  deleteSettingItem,
  updateBoundItem,
  updateRequirementItem,
  updateSettingItem,
} from "@yougan/domain";
import type { YouganValues, Work, WorkProfile, WorkRevision } from "@/lib/types";
import {
  buildRevisionWithNewIntent,
  buildRevisionWithoutIntent,
} from "@/components/studio/revision-panel";
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
      if (values.preview !== undefined) patch.preview = values.preview;
      if (values.revision !== undefined) patch.revision = values.revision;
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

  const updateProfileRequirement = useMemoizedFn(
    (workId: string, itemId: string, spec: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = updateRequirementItem(current.profile, itemId, spec);
      patchProfile(workId, next);
    },
  );

  const deleteProfileRequirement = useMemoizedFn((workId: string, itemId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    const next = deleteRequirementItem(current.profile, itemId);
    patchProfile(workId, next);
  });

  const clearWorkProfileRequirements = useMemoizedFn((workId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    patchProfile(workId, clearRequirements(current.profile));
  });

  const updateProfileSetting = useMemoizedFn(
    (workId: string, itemId: string, spec: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      const next = updateSettingItem(current.profile, itemId, spec);
      patchProfile(workId, next);
    },
  );

  const deleteProfileSetting = useMemoizedFn((workId: string, itemId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    const next = deleteSettingItem(current.profile, itemId);
    patchProfile(workId, next);
  });

  const clearWorkProfileSetting = useMemoizedFn((workId: string) => {
    const current = queryClient
      .getQueryData<Work[]>(queryKeys.works.list)
      ?.find((work) => work.id === workId);
    if (!current) return;
    patchProfile(workId, clearSetting(current.profile));
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

  const patchRevision = useMemoizedFn(
    (workId: string, revision: WorkRevision) => {
      patchWorksCache(queryClient, (works) =>
        works.map((work) =>
          work.id === workId ? { ...work, revision } : work,
        ),
      );
      void updateWorkMutation
        .mutateAsync({
          workId,
          patch: { revision },
        })
        .catch(() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.works.list });
        });
    },
  );

  const appendRevisionIntentToWork = useMemoizedFn(
    (
      workId: string,
      input: Parameters<typeof buildRevisionWithNewIntent>[1],
    ) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      patchRevision(
        workId,
        buildRevisionWithNewIntent(current.revision, input),
      );
    },
  );

  const removeRevisionIntentFromWork = useMemoizedFn(
    (workId: string, intentId: string) => {
      const current = queryClient
        .getQueryData<Work[]>(queryKeys.works.list)
        ?.find((work) => work.id === workId);
      if (!current) return;
      patchRevision(
        workId,
        buildRevisionWithoutIntent(current.revision, intentId),
      );
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
    updateProfileSetting,
    deleteProfileSetting,
    clearWorkProfileSetting,
    updateProfileRequirement,
    deleteProfileRequirement,
    clearWorkProfileRequirements,
    renameWork,
    moveWorkToGroup,
    patchRevision,
    appendRevisionIntentToWork,
    removeRevisionIntentFromWork,
  };
}

export type WorksStore = ReturnType<typeof useWorksStore>;
