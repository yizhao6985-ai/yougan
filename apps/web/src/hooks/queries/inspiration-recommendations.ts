import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { fetchWorkInspirationRecommendations } from "@/services/works";

export function useWorkInspirationRecommendationsQuery(
  workId: string | undefined,
  title: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.works.inspirationRecommendations(
      workId ?? "",
      title ?? "",
    ),
    queryFn: () => fetchWorkInspirationRecommendations(workId!),
    enabled: enabled && Boolean(workId),
    staleTime: 5 * 60 * 1000,
  });
}
