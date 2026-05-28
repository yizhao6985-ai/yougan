import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import type { DiscoverFilters } from "@/lib/discover-taxonomy";
import type { Publication, PublicationStatus } from "@/lib/publication-types";
import {
  deletePublication,
  fetchMyPublications,
  fetchPublicationBySlug,
  fetchPublicationFeed,
  publishWorkToPlatform,
  updatePublicationStatus,
} from "@/services/publications";

export function usePublicationFeedQuery(filters: DiscoverFilters = {}) {
  return useQuery({
    queryKey: queryKeys.publications.feed(filters),
    queryFn: () => fetchPublicationFeed(filters),
  });
}

export function usePublicationBySlugQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.publications.bySlug(slug),
    queryFn: () => fetchPublicationBySlug(slug),
    enabled: Boolean(slug),
    select: (data) => data.publication,
  });
}

export function useMyPublicationsQuery() {
  return useQuery({
    queryKey: queryKeys.publications.mine,
    queryFn: fetchMyPublications,
    select: (data) => data.publications,
  });
}

function patchMyPublicationsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (publications: Publication[]) => Publication[],
) {
  queryClient.setQueryData<{ publications: Publication[] }>(
    queryKeys.publications.mine,
    (current) => ({
      publications: updater(current?.publications ?? []),
    }),
  );
}

export function usePublishWorkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workId, publish = true }: { workId: string; publish?: boolean }) =>
      publishWorkToPlatform(workId, publish),
    onSuccess: ({ publication }) => {
      patchMyPublicationsCache(queryClient, (publications) => {
        const existing = publications.find((item) => item.id === publication.id);
        if (existing) {
          return publications.map((item) =>
            item.id === publication.id ? publication : item,
          );
        }
        return [publication, ...publications];
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
    },
  });
}

export function useUpdatePublicationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      publicationId,
      status,
    }: {
      publicationId: string;
      status: PublicationStatus;
    }) => updatePublicationStatus(publicationId, status),
    onSuccess: ({ publication }) => {
      patchMyPublicationsCache(queryClient, (publications) =>
        publications.map((item) =>
          item.id === publication.id ? publication : item,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
    },
  });
}

export function useDeletePublicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicationId: string) => deletePublication(publicationId),
    onSuccess: (_, publicationId) => {
      patchMyPublicationsCache(queryClient, (publications) =>
        publications.filter((item) => item.id !== publicationId),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
    },
  });
}

export function useInvalidateMyPublications() {
  const queryClient = useQueryClient();
  return () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.publications.mine });
}
