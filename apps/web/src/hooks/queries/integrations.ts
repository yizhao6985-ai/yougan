import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import {
  disconnectPlatform,
  fetchOAuthStatus,
  listPlatformIntegrations,
  startPlatformAuthorization,
} from "@/services/integrations";

export function useOAuthStatusQuery() {
  return useQuery({
    queryKey: queryKeys.integrations.oauthStatus,
    queryFn: fetchOAuthStatus,
  });
}

export function usePlatformIntegrationsQuery() {
  return useQuery({
    queryKey: queryKeys.integrations.platforms,
    queryFn: listPlatformIntegrations,
    select: (data) => data.platforms,
  });
}

export function useStartPlatformAuthorizationMutation() {
  return useMutation({
    mutationFn: (platformId: string) => startPlatformAuthorization(platformId),
    onSuccess: ({ authorizationUrl }) => {
      window.location.href = authorizationUrl;
    },
  });
}

export function useDisconnectPlatformMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (platformId: string) => disconnectPlatform(platformId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.platforms,
      });
    },
  });
}
