import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import type { PlatformCatalogItem } from "@/services/integrations";
import { INTEGRATIONS } from "@/lib/site-copy";

export type OAuthCallbackFeedback =
  | { type: "success"; message: string }
  | { type: "error"; message: string };

interface UseOAuthCallbackQueryOptions {
  status: string | null;
  platform: string | null;
  platforms: PlatformCatalogItem[];
  platformsReady: boolean;
  clearCallbackParams: () => void;
}

export function useOAuthCallbackQuery({
  status,
  platform,
  platforms,
  platformsReady,
  clearCallbackParams,
}: UseOAuthCallbackQueryOptions) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey:
      status && platform
        ? queryKeys.integrations.oauthCallback(status, platform)
        : (["integrations", "oauth-callback", "idle"] as const),
    queryFn: async (): Promise<OAuthCallbackFeedback | null> => {
      if (!status) return null;

      clearCallbackParams();

      if (status === "connected") {
        const label =
          platforms.find((item) => item.id === platform)?.label ??
          platform ??
          "平台";
        await queryClient.invalidateQueries({
          queryKey: queryKeys.integrations.platforms,
        });
        return {
          type: "success",
          message: INTEGRATIONS.oauthSuccess(label),
        };
      }

      if (status === "error") {
        return {
          type: "error",
          message: "授权失败，请重试或联系管理员检查 OAuth 配置。",
        };
      }

      return null;
    },
    enabled: Boolean(status) && platformsReady,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}
