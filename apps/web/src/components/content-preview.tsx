import { useMemo, useState } from "react";

import {
  CreativeContextEmpty,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { PublishPlatformActions } from "@/components/studio/publish-platform-actions";
import { RevisionListControls } from "@/components/studio/revision-list-dialog";
import { PreviewContentList } from "@/components/preview-content-list";
import { groupRevisionItemsByBlock } from "@/lib/revision-display";
import { previewHasContent } from "@yougan/domain";
import { downloadPreviewAsZip } from "@/lib/download-preview-zip";
import { PREVIEW_PANEL } from "@/lib/site-copy";
import type { WorkPreview, WorkRevision } from "@/lib/types";

export function ContentPreview({
  workId,
  preview,
  revision,
  unsaved = false,
  compact = false,
  enablePreviewSelection = false,
  onRemoveRevisionIntent,
}: {
  workId?: string;
  preview?: WorkPreview | null;
  revision?: WorkRevision | null;
  unsaved?: boolean;
  compact?: boolean;
  enablePreviewSelection?: boolean;
  onRemoveRevisionIntent?: (intentId: string) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  const { items: revisionItems, unanchored } = useMemo(
    () => groupRevisionItemsByBlock(revision),
    [revision],
  );
  const anchoredItems = useMemo(
    () =>
      revisionItems.filter((item) => Boolean(item.anchor?.blockId?.trim())),
    [revisionItems],
  );

  const handleDownload = () => {
    if (!preview || downloading) return;
    setDownloadError(null);
    setDownloading(true);
    void downloadPreviewAsZip(preview, { filename: preview.title ?? undefined })
      .catch(() => setDownloadError(PREVIEW_PANEL.downloadFailed))
      .finally(() => setDownloading(false));
  };

  const revisionAction =
    revisionItems.length > 0 ? (
      <RevisionListControls
        count={revisionItems.length}
        anchoredItems={anchoredItems}
        unanchored={unanchored}
        onRemoveIntent={onRemoveRevisionIntent}
      />
    ) : null;

  return (
    <CreativeContextSection
      title={PREVIEW_PANEL.title}
      hint={
        unsaved ? `${PREVIEW_PANEL.hint} ${PREVIEW_PANEL.unsavedBadge}` : PREVIEW_PANEL.hint
      }
      action={revisionAction}
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

            <PreviewContentList
              preview={preview}
              compact={compact}
              galleryKey={workId}
              showImagePrompts
              enablePreviewSelection={enablePreviewSelection}
              revision={revision}
              onRemoveRevisionIntent={onRemoveRevisionIntent}
              expandedBlockId={expandedBlockId}
              onExpandedBlockIdChange={setExpandedBlockId}
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
