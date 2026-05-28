import jwt from "jsonwebtoken";

import { env } from "../env.js";
import {
  cacheGetJson,
  cacheKeys,
  cacheSetJson,
  cacheTtl,
  invalidateIntegrationsCache,
} from "../lib/cache.js";
import type { PublishPlatformId } from "../lib/publish-platforms.js";
import { prisma } from "../db.js";
import type { PlatformIntegrationDTO } from "../schemas.js";

export interface OAuthStatePayload {
  sub: string;
  platform: PublishPlatformId;
}

export function signOAuthState(payload: OAuthStatePayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "10m" });
}

export function verifyOAuthState(token: string): OAuthStatePayload {
  return jwt.verify(token, env.jwtSecret) as OAuthStatePayload;
}

function toIntegrationDTO(integration: {
  id: string;
  platform: string;
  accountName: string | null;
  accountId: string | null;
  status: string;
  scopes: unknown;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PlatformIntegrationDTO {
  return {
    id: integration.id,
    platform: integration.platform,
    accountName: integration.accountName,
    accountId: integration.accountId,
    status: integration.status,
    scopes: Array.isArray(integration.scopes)
      ? (integration.scopes as string[])
      : [],
    tokenExpiresAt: integration.tokenExpiresAt?.toISOString() ?? null,
    connectedAt: integration.createdAt.toISOString(),
    updatedAt: integration.updatedAt.toISOString(),
  };
}

export async function listUserIntegrations(userId: string) {
  const cacheKey = cacheKeys.integrations(userId);
  const cached = await cacheGetJson<PlatformIntegrationDTO[]>(cacheKey);
  if (cached) return cached;

  const rows = await prisma.platformIntegration.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const result = rows.map(toIntegrationDTO);
  await cacheSetJson(cacheKey, result, cacheTtl.integrationsTtl);
  return result;
}

export async function getUserIntegration(userId: string, platform: string) {
  const row = await prisma.platformIntegration.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (!row) return null;
  return toIntegrationDTO(row);
}

export async function upsertIntegration(
  userId: string,
  platform: string,
  data: {
    accountName?: string | null;
    accountId?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    tokenExpiresAt?: Date | null;
    scopes?: string[];
    status?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const row = await prisma.platformIntegration.upsert({
    where: { userId_platform: { userId, platform } },
    create: {
      userId,
      platform,
      accountName: data.accountName ?? null,
      accountId: data.accountId ?? null,
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
      tokenExpiresAt: data.tokenExpiresAt ?? null,
      scopes: data.scopes ?? [],
      status: data.status ?? "connected",
      metadata: data.metadata ?? {},
    },
    update: {
      accountName: data.accountName ?? null,
      accountId: data.accountId ?? null,
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
      tokenExpiresAt: data.tokenExpiresAt ?? null,
      scopes: data.scopes ?? [],
      status: data.status ?? "connected",
      metadata: data.metadata ?? {},
    },
  });
  await invalidateIntegrationsCache(userId);
  return toIntegrationDTO(row);
}

export async function disconnectIntegration(userId: string, platform: string) {
  const existing = await prisma.platformIntegration.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (!existing) return false;
  await prisma.platformIntegration.delete({
    where: { userId_platform: { userId, platform } },
  });
  await invalidateIntegrationsCache(userId);
  return true;
}

export async function exchangeOAuthCode(
  platform: PublishPlatformId,
  code: string,
  redirectUri: string,
  oauth: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
  },
) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: oauth.clientId,
    client_secret: oauth.clientSecret,
  });

  const response = await fetch(oauth.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "OAuth token exchange failed");
  }

  return (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    openid?: string;
    user_id?: string;
    nickname?: string;
  };
}
