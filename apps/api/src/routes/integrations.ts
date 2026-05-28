import { Router } from "express";
import { z } from "zod";

import {
  getPlatformOAuthConfig,
  isPublishPlatformId,
  listPlatformOAuthEnvStatus,
  PUBLISH_PLATFORMS,
} from "../lib/publish-platforms.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../env.js";
import {
  disconnectIntegration,
  exchangeOAuthCode,
  getUserIntegration,
  listUserIntegrations,
  signOAuthState,
  upsertIntegration,
  verifyOAuthState,
} from "../services/integrations.js";

export const integrationsRouter = Router();

function oauthCallbackUrl() {
  return `${env.publicBaseUrl}/api/integrations/oauth/callback`;
}

function settingsIntegrationsUrl(status?: string, platform?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (platform) params.set("platform", platform);
  const query = params.toString();
  return query
    ? `/settings/integrations?${query}`
    : "/settings/integrations";
}

integrationsRouter.get("/oauth-status", requireAuth, async (_req: AuthedRequest, res) => {
  res.json({
    callbackUrl: oauthCallbackUrl(),
    smtpConfigured: env.mail.smtpConfigured,
    platforms: listPlatformOAuthEnvStatus(),
  });
});

integrationsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const integrations = await listUserIntegrations(req.userId!);
  const byPlatform = new Map(integrations.map((item) => [item.platform, item]));

  const platforms = PUBLISH_PLATFORMS.map((platform) => {
    const integration = byPlatform.get(platform.id) ?? null;
    return {
      id: platform.id,
      label: platform.label,
      description: platform.description,
      oauthConfigured: getPlatformOAuthConfig(platform.id) !== null,
      connected: integration?.status === "connected",
      integration,
    };
  });

  res.json({ platforms });
});

integrationsRouter.post(
  "/:platform/authorize",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const platform = req.params.platform;
    if (!isPublishPlatformId(platform)) {
      res.status(404).json({ error: "Platform not found" });
      return;
    }

    const oauth = getPlatformOAuthConfig(platform);
    if (!oauth) {
      res.status(503).json({
        error: "该平台 OAuth 尚未配置，请联系管理员配置客户端凭证",
      });
      return;
    }

    const state = signOAuthState({ sub: req.userId!, platform });
    const redirectUri = oauthCallbackUrl();
    const url = new URL(oauth.authorizeUrl!);
    url.searchParams.set("client_id", oauth.clientId!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    if (oauth.scopes?.length) {
      url.searchParams.set("scope", oauth.scopes.join(" "));
    }

    res.json({ authorizationUrl: url.toString() });
  },
);

integrationsRouter.get("/oauth/callback", async (req, res) => {
  const query = z
    .object({
      code: z.string().optional(),
      state: z.string().optional(),
      error: z.string().optional(),
    })
    .safeParse(req.query);

  if (!query.success || query.data.error) {
    res.redirect(settingsIntegrationsUrl("error"));
    return;
  }

  const { code, state } = query.data;
  if (!code || !state) {
    res.redirect(settingsIntegrationsUrl("error"));
    return;
  }

  try {
    const payload = verifyOAuthState(state);
    const oauth = getPlatformOAuthConfig(payload.platform);
    if (!oauth) {
      res.redirect(settingsIntegrationsUrl("error", payload.platform));
      return;
    }

    const token = await exchangeOAuthCode(
      payload.platform,
      code,
      oauthCallbackUrl(),
      {
        clientId: oauth.clientId!,
        clientSecret: oauth.clientSecret!,
        tokenUrl: oauth.tokenUrl!,
      },
    );

    const expiresAt =
      typeof token.expires_in === "number"
        ? new Date(Date.now() + token.expires_in * 1000)
        : null;

    await upsertIntegration(payload.sub, payload.platform, {
      accessToken: token.access_token ?? null,
      refreshToken: token.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      accountId: token.openid ?? token.user_id ?? null,
      accountName: token.nickname ?? null,
      scopes: token.scope ? token.scope.split(/[\s,]+/).filter(Boolean) : oauth.scopes,
      status: "connected",
      metadata: { connectedVia: "oauth" },
    });

    res.redirect(settingsIntegrationsUrl("connected", payload.platform));
  } catch {
    res.redirect(settingsIntegrationsUrl("error"));
  }
});

integrationsRouter.delete(
  "/:platform",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const platform = req.params.platform;
    if (!isPublishPlatformId(platform)) {
      res.status(404).json({ error: "Platform not found" });
      return;
    }

    const ok = await disconnectIntegration(req.userId!, platform);
    if (!ok) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }
    res.status(204).send();
  },
);

integrationsRouter.get(
  "/:platform",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const platform = req.params.platform;
    if (!isPublishPlatformId(platform)) {
      res.status(404).json({ error: "Platform not found" });
      return;
    }

    const integration = await getUserIntegration(req.userId!, platform);
    if (!integration) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }
    res.json({ integration });
  },
);
