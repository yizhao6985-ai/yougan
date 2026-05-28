export const PUBLISH_PLATFORMS = [
  {
    id: "xiaohongshu",
    label: "小红书",
    description: "授权后可将作品一键发布到小红书笔记。",
  },
  {
    id: "weibo",
    label: "微博",
    description: "授权后可将内容同步发布到微博。",
  },
  {
    id: "wechat",
    label: "微信公众号",
    description: "授权后可将图文内容推送到公众号草稿或发表。",
  },
  {
    id: "douyin",
    label: "抖音",
    description: "授权后可将短视频或图文内容发布到抖音。",
  },
  {
    id: "kuaishou",
    label: "快手",
    description: "授权后可将短视频或图文内容发布到快手。",
  },
  {
    id: "bilibili",
    label: "哔哩哔哩",
    description: "授权后可将视频或动态内容发布到 B 站。",
  },
] as const;

export type PublishPlatformId = (typeof PUBLISH_PLATFORMS)[number]["id"];

export function isPublishPlatformId(value: string): value is PublishPlatformId {
  return PUBLISH_PLATFORMS.some((platform) => platform.id === value);
}

export interface PlatformOAuthEnvConfig {
  clientId?: string;
  clientSecret?: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
}

export function getPlatformOAuthConfig(
  platform: PublishPlatformId,
): PlatformOAuthEnvConfig | null {
  const prefix = platform.toUpperCase();
  const clientId = process.env[`${prefix}_OAUTH_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`${prefix}_OAUTH_CLIENT_SECRET`]?.trim();
  const authorizeUrl = process.env[`${prefix}_OAUTH_AUTHORIZE_URL`]?.trim();
  const tokenUrl = process.env[`${prefix}_OAUTH_TOKEN_URL`]?.trim();
  const scopesRaw = process.env[`${prefix}_OAUTH_SCOPES`]?.trim();

  if (!clientId || !clientSecret || !authorizeUrl || !tokenUrl) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    authorizeUrl,
    tokenUrl,
    scopes: scopesRaw ? scopesRaw.split(/[\s,]+/).filter(Boolean) : [],
  };
}

export function isPlatformOAuthConfigured(platform: PublishPlatformId) {
  return getPlatformOAuthConfig(platform) !== null;
}

const OAUTH_ENV_KEYS = [
  "CLIENT_ID",
  "CLIENT_SECRET",
  "AUTHORIZE_URL",
  "TOKEN_URL",
] as const;

export function getPlatformOAuthEnvStatus(platform: PublishPlatformId) {
  const prefix = platform.toUpperCase();
  const variables = OAUTH_ENV_KEYS.map((suffix) => ({
    key: `${prefix}_OAUTH_${suffix}`,
    set: Boolean(process.env[`${prefix}_OAUTH_${suffix}`]?.trim()),
  }));
  const configured = variables.every((item) => item.set);
  const scopesKey = `${prefix}_OAUTH_SCOPES`;
  return {
    platform,
    configured,
    variables,
    scopesKey,
    scopesSet: Boolean(process.env[scopesKey]?.trim()),
  };
}

export function listPlatformOAuthEnvStatus() {
  return PUBLISH_PLATFORMS.map((p) => ({
    id: p.id,
    label: p.label,
    ...getPlatformOAuthEnvStatus(p.id),
  }));
}
