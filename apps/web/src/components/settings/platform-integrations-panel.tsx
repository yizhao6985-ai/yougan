import { useEffect, useState } from "react";
import { Link2Icon, Link2OffIcon, RefreshCwIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  SettingsNotice,
  SettingsPageHeader,
  SettingsPanelCard,
} from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import {
  useDisconnectPlatformMutation,
  useOAuthStatusQuery,
  usePlatformIntegrationsQuery,
  useStartPlatformAuthorizationMutation,
} from "@/hooks/queries/integrations";
import { ApiError } from "@/services/client";
import { INTEGRATIONS } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

export function PlatformIntegrationsPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionPlatform, setActionPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    data: platforms = [],
    isLoading,
    isFetching,
    refetch,
  } = usePlatformIntegrationsQuery();
  const { data: oauthStatus } = useOAuthStatusQuery();
  const connectMutation = useStartPlatformAuthorizationMutation();
  const disconnectMutation = useDisconnectPlatformMutation();

  useEffect(() => {
    const oauthStatus = searchParams.get("status");
    const oauthPlatform = searchParams.get("platform");
    if (!oauthStatus) return;

    if (oauthStatus === "connected") {
      const label =
        platforms.find((item) => item.id === oauthPlatform)?.label ??
        oauthPlatform ??
        "平台";
      setNotice(INTEGRATIONS.oauthSuccess(label));
      void refetch();
    } else if (oauthStatus === "error") {
      setError("授权失败，请重试或联系管理员检查 OAuth 配置。");
    }

    const next = new URLSearchParams(searchParams);
    next.delete("status");
    next.delete("platform");
    setSearchParams(next, { replace: true });
  }, [platforms, refetch, searchParams, setSearchParams]);

  const handleConnect = async (platformId: string) => {
    setActionPlatform(platformId);
    setError(null);
    setNotice(null);
    try {
      await connectMutation.mutateAsync(platformId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "发起授权失败");
      setActionPlatform(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setActionPlatform(platformId);
    setError(null);
    setNotice(null);
    try {
      await disconnectMutation.mutateAsync(platformId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "解除授权失败");
    } finally {
      setActionPlatform(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title={INTEGRATIONS.title}
        description={INTEGRATIONS.intro}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCwIcon className="size-3.5" />
            刷新
          </Button>
        }
      />

      {notice ? <SettingsNotice tone="success">{notice}</SettingsNotice> : null}
      {error ? <SettingsNotice tone="error">{error}</SettingsNotice> : null}

      {oauthStatus ? (
        <SettingsPanelCard
          title={INTEGRATIONS.oauthStatusTitle}
          description={INTEGRATIONS.oauthStatusIntro}
        >
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-foreground/90">
                {INTEGRATIONS.oauthCallback}
              </p>
              <code className="mt-1 block break-all rounded-lg bg-muted/60 px-3 py-2 text-xs">
                {oauthStatus.callbackUrl}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              {INTEGRATIONS.oauthDocsLink}：项目根目录{" "}
              <code className="rounded bg-muted/60 px-1">docs/platform-oauth.md</code>
            </p>
            <ul className="space-y-3">
              {oauthStatus.platforms.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        item.configured
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {item.configured
                        ? INTEGRATIONS.oauthConfigured
                        : INTEGRATIONS.oauthMissing}
                    </span>
                  </div>
                  {!item.configured ? (
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {item.variables
                        .filter((v) => !v.set)
                        .map((v) => (
                          <li key={v.key}>{v.key}</li>
                        ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </SettingsPanelCard>
      ) : null}

      <div className="flex flex-col gap-3">
        {isLoading && platforms.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : (
          platforms.map((platform) => {
            const busy = actionPlatform === platform.id;
            const connected = platform.connected;

            return (
              <SettingsPanelCard
                key={platform.id}
                className={cn(
                  connected && "border-emerald-200/80 bg-emerald-50/30",
                )}
              >
                <div className="flex flex-col gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-foreground">
                        {platform.label}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          connected
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {connected ? "已连接" : "未连接"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {platform.description}
                    </p>
                    {connected && platform.integration?.accountName ? (
                      <p className="mt-2 text-sm text-emerald-700">
                        已绑定：{platform.integration.accountName}
                      </p>
                    ) : null}
                    {!platform.oauthConfigured ? (
                      <p className="mt-2 text-sm text-amber-700">
                        OAuth 尚未配置，请联系管理员接入平台开放能力。
                      </p>
                    ) : null}
                  </div>

                  <div className="flex justify-end border-t border-border/60 pt-4">
                    {connected ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={busy}
                        onClick={() => void handleDisconnect(platform.id)}
                      >
                        <Link2OffIcon className="size-3.5" />
                        解除
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1"
                        disabled={busy || !platform.oauthConfigured}
                        onClick={() => void handleConnect(platform.id)}
                      >
                        <Link2Icon className="size-3.5" />
                        授权连接
                      </Button>
                    )}
                  </div>
                </div>
              </SettingsPanelCard>
            );
          })
        )}
      </div>
    </div>
  );
}
