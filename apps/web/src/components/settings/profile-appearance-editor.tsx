import { useRef, useState } from "react";
import { CameraIcon, ImagePlusIcon, Loader2Icon, Trash2Icon } from "lucide-react";

import { AccountCover } from "@/components/account/account-cover";
import { AuthorAvatar } from "@/components/content/author-avatar";
import { Button } from "@/components/ui/button";
import { authorDisplayName } from "@/lib/publication-utils";
import { ACCOUNT_PAGE } from "@/lib/site-copy";
import { scene } from "@/lib/scene-styles";
import { uploadImage } from "@/services/upload";
import { ApiError } from "@/services/client";
import { cn } from "@/lib/utils";

type MediaTarget = "avatar" | "cover";

export function ProfileAppearanceEditor({
  displayName,
  avatarUrl,
  coverUrl,
  disabled,
  onAvatarChange,
  onCoverChange,
}: {
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  disabled?: boolean;
  onAvatarChange: (url: string | null) => void;
  onCoverChange: (url: string | null) => void;
}) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<MediaTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  const author = {
    id: "preview",
    name: displayName,
    email: "",
    avatarUrl,
  };

  const handleFile = async (target: MediaTarget, file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(target);
    try {
      const { url } = await uploadImage(file, target);
      if (target === "avatar") onAvatarChange(url);
      else onCoverChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "上传失败");
    } finally {
      setUploading(null);
      const ref = target === "avatar" ? avatarInputRef : coverInputRef;
      if (ref.current) ref.current.value = "";
    }
  };

  const busy = disabled || uploading !== null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        布局与公开个人主页一致。将鼠标移到封面或头像上即可更换。
      </p>

      <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm shadow-border/20">
        {/* 封面区 */}
        <div className="group relative">
          <AccountCover
            coverUrl={coverUrl}
            className="h-32 sm:h-36"
            persistentOverlay
          />

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity",
              "group-hover:opacity-100 focus-within:opacity-100",
              uploading === "cover" && "opacity-100",
            )}
          >
            {uploading === "cover" ? (
              <Loader2Icon className="size-6 animate-spin text-white" />
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <CameraIcon className="size-4" />
                  {coverUrl ? "更换封面" : "上传封面"}
                </Button>
                {coverUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 hover:text-white"
                    disabled={busy}
                    onClick={() => onCoverChange(null)}
                  >
                    <Trash2Icon className="size-4" />
                    移除
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* 头像 + 预览信息 */}
        <div className="relative px-5 pb-5 sm:px-6">
          <div className="group/avatar relative -mt-12 inline-block sm:-mt-14">
            <AuthorAvatar
              author={author}
              size="lg"
              className={cn(
                scene.accountHeroAvatar,
                "size-24 border-4 border-white text-3xl shadow-md ring-1 ring-border/40 sm:size-28 sm:text-4xl",
              )}
            />
            {!avatarUrl ? (
              <span
                className={cn(
                  scene.accountHeroAvatar,
                  "pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover/avatar:opacity-100",
                )}
              >
                <ImagePlusIcon className="size-8 text-white" />
              </span>
            ) : null}

            <div
              className={cn(
                scene.accountHeroAvatar,
                "absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity",
                "group-hover/avatar:opacity-100 focus-within:opacity-100",
                uploading === "avatar" && "opacity-100",
              )}
            >
              {uploading === "avatar" ? (
                <Loader2Icon className="size-6 animate-spin text-white" />
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <CameraIcon className="size-4" />
                  头像
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">
              {authorDisplayName(author)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">主页预览</p>
          </div>
        </div>
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={busy}
        onChange={(e) => void handleFile("avatar", e.target.files?.[0])}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={busy}
        onChange={(e) => void handleFile("cover", e.target.files?.[0])}
      />

      {/* 移动端 / 无障碍：显式操作条 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <MediaHintCard
          label={ACCOUNT_PAGE.coverLabel}
          hint={ACCOUNT_PAGE.coverHint}
          hasImage={Boolean(coverUrl)}
          uploading={uploading === "cover"}
          disabled={busy}
          onUpload={() => coverInputRef.current?.click()}
          onRemove={coverUrl ? () => onCoverChange(null) : undefined}
        />
        <MediaHintCard
          label={ACCOUNT_PAGE.avatarLabel}
          hint={ACCOUNT_PAGE.avatarHint}
          hasImage={Boolean(avatarUrl)}
          uploading={uploading === "avatar"}
          disabled={busy}
          onUpload={() => avatarInputRef.current?.click()}
          onRemove={avatarUrl ? () => onAvatarChange(null) : undefined}
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function MediaHintCard({
  label,
  hint,
  hasImage,
  uploading,
  disabled,
  onUpload,
  onRemove,
}: {
  label: string;
  hint: string;
  hasImage: boolean;
  uploading: boolean;
  disabled: boolean;
  onUpload: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
      <p className="text-sm font-medium text-foreground/90">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onUpload}
        >
          {uploading ? "上传中…" : hasImage ? "更换" : "上传"}
        </Button>
        {onRemove ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={onRemove}
          >
            移除
          </Button>
        ) : null}
      </div>
    </div>
  );
}
