import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import {
  fetchUserProfile,
  fetchUserProfileStats,
  fetchUserPublications,
} from "@/services/users";

export function useUserProfileQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () => fetchUserProfile(userId),
    enabled: Boolean(userId),
    select: (data) => data.user,
  });
}

export function useUserProfileStatsQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.stats(userId),
    queryFn: () => fetchUserProfileStats(userId),
    enabled: Boolean(userId),
    select: (data) => data.stats,
  });
}

export function useUserPublicationsQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.publications(userId),
    queryFn: () => fetchUserPublications(userId),
    enabled: Boolean(userId),
    select: (data) => data.publications,
  });
}
