import { useState } from "react";
import { Link } from "react-router-dom";

import {
  SettingsNotice,
  SettingsPageHeader,
  SettingsPanelCard,
} from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useMeQuery,
  useRequestEmailChangeMutation,
  useUpdateProfileMutation,
} from "@/hooks/queries/auth";
import { maskChinaMobilePhone } from "@yougan/domain";
import { ACCOUNT } from "@/lib/site-copy";
import { ApiError } from "@/services/client";

export function AccountSettingsPanel() {
  const { data: user } = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const emailChangeMutation = useRequestEmailChangeMutation();

  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devConfirmUrl, setDevConfirmUrl] = useState<string | null>(null);

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setDevConfirmUrl(null);

    const wantsPasswordChange = Boolean(newPassword || confirmPassword);

    if (!wantsPasswordChange) {
      setNotice("没有需要保存的更改");
      return;
    }

    if (newPassword.length < 6) {
      setError("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    const hasPassword = Boolean(user?.hasPassword);
    if (hasPassword && !currentPassword) {
      setError("修改密码需要填写当前密码");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        ...(currentPassword ? { currentPassword } : {}),
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("密码已更新");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存失败");
    }
  };

  const handleEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setDevConfirmUrl(null);

    if (!newEmail.trim()) {
      setError("请输入新邮箱");
      return;
    }
    if (!emailCurrentPassword) {
      setError("修改邮箱需要填写当前密码");
      return;
    }

    try {
      const result = await emailChangeMutation.mutateAsync({
        newEmail: newEmail.trim(),
        currentPassword: emailCurrentPassword,
      });
      setNotice(result.message ?? ACCOUNT.emailChangeSent);
      if (result.devConfirmUrl) {
        setDevConfirmUrl(result.devConfirmUrl);
      }
      setNewEmail("");
      setEmailCurrentPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "请求失败");
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="账户信息"
        description="管理登录邮箱与密码。"
      />

      <SettingsPanelCard title="登录方式">
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">手机号：</span>
            <span className="text-foreground">
              {user?.phone ? maskChinaMobilePhone(user.phone) : "未绑定"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">邮箱：</span>
            <span className="text-foreground">{user?.email ?? "未绑定"}</span>
          </p>
        </div>
      </SettingsPanelCard>

      <SettingsPanelCard
        title={ACCOUNT.emailChangeTitle}
        description={ACCOUNT.emailChangeHint}
      >
        <form className="space-y-4" onSubmit={(e) => void handleEmailChange(e)}>
          <Input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder={ACCOUNT.newEmailPlaceholder}
            autoComplete="email"
          />
          <Input
            type="password"
            value={emailCurrentPassword}
            onChange={(event) => setEmailCurrentPassword(event.target.value)}
            placeholder={ACCOUNT.currentPasswordPlaceholder}
            autoComplete="current-password"
          />
          <Button type="submit" disabled={emailChangeMutation.isPending}>
            {emailChangeMutation.isPending
              ? "发送中..."
              : ACCOUNT.sendConfirmEmail}
          </Button>
        </form>
      </SettingsPanelCard>

      <SettingsPanelCard
        title={user?.hasPassword ? "修改密码" : "设置登录密码"}
        description={
          user?.hasPassword
            ? "建议定期更换密码，保障账号安全。"
            : "设置后可使用手机号/邮箱 + 密码登录。"
        }
      >
        <form className="space-y-4" onSubmit={(e) => void handlePasswordSubmit(e)}>
          {user?.hasPassword ? (
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="当前密码"
            />
          ) : null}
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="新密码（至少 6 位）"
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="确认新密码"
          />
          <p className="text-xs text-muted-foreground">
            忘记当前密码？
            <Link
              to="/forgot-password"
              className="ml-1 text-primary underline-offset-2 hover:underline"
            >
              通过邮件重置
            </Link>
          </p>

          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "保存中..." : "更新密码"}
            </Button>
          </div>
        </form>
      </SettingsPanelCard>

      {notice ? <SettingsNotice tone="success">{notice}</SettingsNotice> : null}
      {devConfirmUrl ? (
        <SettingsNotice tone="success">
          开发环境确认链接：
          <a
            href={devConfirmUrl}
            className="ml-1 break-all underline"
            target="_blank"
            rel="noreferrer"
          >
            {devConfirmUrl}
          </a>
        </SettingsNotice>
      ) : null}
      {error ? <SettingsNotice tone="error">{error}</SettingsNotice> : null}
    </div>
  );
}
