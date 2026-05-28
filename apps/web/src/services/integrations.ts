import { apiFetch } from "@/services/client";

export interface PlatformIntegration {
  id: string;
  platform: string;
  accountName: string | null;
  accountId: string | null;
  status: string;
  scopes: string[];
  tokenExpiresAt: string | null;
  connectedAt: string;
  updatedAt: string;
}

export interface PlatformCatalogItem {
  id: string;
  label: string;
  description: string;
  oauthConfigured: boolean;
  connected: boolean;
  integration: PlatformIntegration | null;
}

export async function listPlatformIntegrations() {
  return apiFetch<{ platforms: PlatformCatalogItem[] }>("/api/integrations");
}

export async function startPlatformAuthorization(platformId: string) {
  return apiFetch<{ authorizationUrl: string }>(
    `/api/integrations/${platformId}/authorize`,
    { method: "POST" },
  );
}

export async function disconnectPlatform(platformId: string) {
  await apiFetch<void>(`/api/integrations/${platformId}`, { method: "DELETE" });
}

export type OAuthEnvVariable = {
  key: string;
  set: boolean;
};

export type PlatformOAuthStatus = {
  id: string;
  label: string;
  platform: string;
  configured: boolean;
  variables: OAuthEnvVariable[];
  scopesKey: string;
  scopesSet: boolean;
};

export async function fetchOAuthStatus() {
  return apiFetch<{
    callbackUrl: string;
    smtpConfigured: boolean;
    platforms: PlatformOAuthStatus[];
  }>("/api/integrations/oauth-status");
}
