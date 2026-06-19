import { useState } from "react";

import {
  CreativeContextEmpty,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { PublishPlatformActions } from "@/components/studio/publish-platform-actions";
import { PreviewBlockList } from "@/components/preview-block-list";
import { previewHasContent } from "@yougan/domain";
import { downloadPreviewAsZip } from "@/lib/download-preview-zip";
import { PREVIEW_PANEL } from "@/lib/site-copy";
import type { WorkPreview } from "@/lib/types";

export function ContentPreview({
  workId,
  preview,
  unsaved = false,
  compact = false,
}: {
  workId?: string;
  preview?: WorkPreview | null;
  unsaved?: boolean;
  compact?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = () => {
    if (!preview || downloading) return;
    setDownloadError(null);
    setDownloading(true);
    void downloadPreviewAsZip(preview, { filename: preview.title ?? undefined })
      .catch(() => setDownloadError(PREVIEW_PANEL.downloadFailed))
      .finally(() => setDownloading(false));
  };
  return (
    <CreativeContextSection
      title={PREVIEW_PANEL.title}
      hint={
        unsaved ? `${PREVIEW_PANEL.hint} ${PREVIEW_PANEL.unsavedBadge}` : PREVIEW_PANEL.hint
      }
      compact={compact}
    >
      {!preview || !previewHasContent(preview) ? (
        <CreativeContextEmpty>{PREVIEW_PANEL.empty}</CreativeContextEmpty>
      ) : (
        <div className="space-y-3">
          <div className="space-y-4 rounded-lg border border-border/80 bg-background/80 p-4">
            {preview.title ? (
              <h4 className="text-pretty text-lg font-semibold leading-7 text-foreground">
                {preview.title}
              </h4>
            ) : null}

            <PreviewBlockList
              blocks={preview.blocks}
              compact={compact}
              galleryKey={workId}
              showImagePrompts
            />

            {preview.hashtags?.length ? (
              <div className="flex flex-wrap gap-2">
                {preview.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-accent px-2 py-1 text-xs text-primary"
                  >
                    #{tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-2 rounded-lg border border-border/80 bg-card/70 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground/90 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading
                  ? PREVIEW_PANEL.downloading
                  : PREVIEW_PANEL.downloadAction}
              </button>
              {workId ? (
                <PublishPlatformActions workId={workId} preview={preview} />
              ) : null}
            </div>
            {downloadError ? (
              <p className="text-right text-xs text-destructive">
                {downloadError}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </CreativeContextSection>
  );
}
