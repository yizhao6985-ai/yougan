import { apiFetch } from "@/services/client";
import type { Publication } from "@/lib/publication-types";

export type PublicUser = {
  id: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  publicationCount: number;
};

export type UserProfileStats = {
  publicationCount: number;
  totalViews: number;
  publicationsByMonth: Array<{ month: string; count: number }>;
};

export async function fetchUserProfile(userId: string) {
  return apiFetch<{ user: PublicUser }>(`/api/users/${userId}`);
}

export async function fetchUserPublications(userId: string) {
  return apiFetch<{ publications: Publication[] }>(
    `/api/users/${userId}/publications`,
  );
}

export async function fetchUserProfileStats(userId: string) {
  return apiFetch<{ stats: UserProfileStats }>(
    `/api/users/${userId}/stats`,
  );
}
