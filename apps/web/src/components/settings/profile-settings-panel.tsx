import { useEffect, useState } from "react";

import { ProfileAppearanceEditor } from "@/components/settings/profile-appearance-editor";
import {
  SettingsNotice,
  SettingsPageHeader,
  SettingsPanelCard,
} from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useMeQuery,
  useUpdateProfileMutation,
} from "@/hooks/queries/auth";
import { ApiError } from "@/services/client";

const BIO_MAX_LENGTH = 160;

export function ProfileSettingsPanel() {
  const { data: user } = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setBio(user?.bio ?? "");
    setAvatarUrl(user?.avatarUrl ?? null);
    setCoverUrl(user?.coverUrl ?? null);
  }, [user?.name, user?.bio, user?.avatarUrl, user?.coverUrl]);

  const saveMedia = async (
    patch: { avatarUrl?: string | null; coverUrl?: string | null },
  ) => {
    setError(null);
    try {
      await updateProfileMutation.mutateAsync(patch);
      setNotice("图片已更新");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存失败");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedName = name.trim();
    const trimmedBio = bio.trim();

    const payload: { name?: string; bio?: string } = {};

    if (trimmedName !== (user?.name ?? "")) {
      payload.name = trimmedName;
    }
    if (trimmedBio !== (user?.bio ?? "")) {
      payload.bio = trimmedBio;
    }

    if (!Object.keys(payload).length) {
      setNotice("没有需要保存的更改");
      return;
    }

    try {
      const { user: updatedUser } =
        await updateProfileMutation.mutateAsync(payload);
      setName(updatedUser.name ?? "");
      setBio(updatedUser.bio ?? "");
      setNotice("保存成功");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存失败");
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="个人信息"
        description="设置对外展示的头像、封面、昵称与个人签名，会同步到个人主页与内容作者信息。"
      />

      <SettingsPanelCard
        title="形象展示"
        description="头像与封面将展示在个人主页顶部，与访客看到的布局相同。"
      >
        <ProfileAppearanceEditor
          displayName={
            name.trim() ||
            (user?.email ? user.email.split("@")[0] : "") ||
            "用户"
          }
          avatarUrl={avatarUrl}
          coverUrl={coverUrl}
          disabled={updateProfileMutation.isPending}
          onAvatarChange={(url) => {
            setAvatarUrl(url);
            void saveMedia({ avatarUrl: url });
          }}
          onCoverChange={(url) => {
            setCoverUrl(url);
            void saveMedia({ coverUrl: url });
          }}
        />
      </SettingsPanelCard>

      <SettingsPanelCard>
        <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/90">昵称</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="显示名称"
            />
            <p className="text-xs text-muted-foreground">
              用于内容作者展示、菜单显示等场景。未设置时将使用邮箱前缀。
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground/90">
                个人签名
              </label>
              <span className="text-xs text-muted-foreground">
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(event) =>
                setBio(event.target.value.slice(0, BIO_MAX_LENGTH))
              }
              placeholder="写一句介绍自己的话"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              可选。将展示在你的个人主页与公开内容作者信息中。
            </p>
          </div>

          {notice ? <SettingsNotice tone="success">{notice}</SettingsNotice> : null}
          {error ? <SettingsNotice tone="error">{error}</SettingsNotice> : null}

          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "保存中..." : "保存更改"}
            </Button>
          </div>
        </form>
      </SettingsPanelCard>
    </div>
  );
}
