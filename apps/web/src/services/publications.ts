import { apiFetch } from "@/services/client";
import type {
  DiscoverFacets,
  DiscoverFilters,
  PublicationMetadataOverrides,
  PublicationMetadataPreview,
} from "@/lib/discover-taxonomy";
import type { Publication, PublicationStatus } from "@/lib/publication-types";

export type PublicationFeedResponse = {
  publications: Publication[];
  total: number;
  facets: DiscoverFacets;
};

function buildFeedQuery(filters: DiscoverFilters = {}) {
  const params = new URLSearchParams();
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.contentFormat) params.set("contentFormat", filters.contentFormat);
  if (filters.topicCategory) params.set("topicCategory", filters.topicCategory);
  if (filters.mediaType) params.set("mediaType", filters.mediaType);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchPublicationFeed(filters: DiscoverFilters = {}) {
  return apiFetch<PublicationFeedResponse>(
    `/api/publications/feed${buildFeedQuery(filters)}`,
  );
}

export async function fetchPublicationBySlug(slug: string) {
  return apiFetch<{ publication: Publication }>(
    `/api/publications/slug/${slug}`,
  );
}

export async function fetchMyPublications() {
  return apiFetch<{ publications: Publication[] }>("/api/publications/mine");
}

export async function fetchPublicationMetadataPreview(workId: string) {
  const params = new URLSearchParams({ workId });
  return apiFetch<PublicationMetadataPreview>(
    `/api/publications/preview-metadata?${params.toString()}`,
  );
}

export async function publishWorkToPlatform(
  workId: string,
  publish = true,
  metadata?: PublicationMetadataOverrides,
) {
  return apiFetch<{ publication: Publication }>("/api/publications", {
    method: "POST",
    body: JSON.stringify({ workId, publish, metadata }),
  });
}

export async function updatePublicationStatus(
  publicationId: string,
  status: PublicationStatus,
) {
  return apiFetch<{ publication: Publication }>(
    `/api/publications/${publicationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export async function deletePublication(publicationId: string) {
  await apiFetch<void>(`/api/publications/${publicationId}`, {
    method: "DELETE",
  });
}
