import { MarkdownContent } from "@/components/markdown-content";
import {
  CreativeContextEmpty,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { PublishPlatformActions } from "@/components/studio/publish-platform-actions";
import { WorkPreviewImages } from "@/components/work-preview-images";
import { PREVIEW_PANEL } from "@/lib/site-copy";
import type { WorkPreview } from "@/lib/types";

function hasPreviewContent(preview: WorkPreview) {
  return Boolean(preview.body?.trim()) || Boolean(preview.images?.length);
}

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
  return (
    <CreativeContextSection
      title={PREVIEW_PANEL.title}
      hint={
        unsaved ? `${PREVIEW_PANEL.hint} ${PREVIEW_PANEL.unsavedBadge}` : PREVIEW_PANEL.hint
      }
      compact={compact}
    >
      {!preview || !hasPreviewContent(preview) ? (
        <CreativeContextEmpty>{PREVIEW_PANEL.empty}</CreativeContextEmpty>
      ) : (
        <div className="space-y-3">
          <div className="space-y-4 rounded-lg border border-border/80 bg-background/80 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {preview.platform}
              </p>
              {preview.title ? (
                <h4 className="mt-1.5 text-pretty text-lg font-semibold leading-7 text-foreground">
                  {preview.title}
                </h4>
              ) : null}
            </div>

            {preview.images?.length ? (
              <WorkPreviewImages images={preview.images} compact={compact} />
            ) : null}

            {preview.body?.trim() ? (
              <MarkdownContent content={preview.body} />
            ) : null}

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
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg border border-border/80 bg-card/70 px-3 py-2.5">
            {preview.body?.trim() ? (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(preview.body)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground/90 transition hover:bg-muted"
              >
                复制内容
              </button>
            ) : null}
            {workId ? (
              <PublishPlatformActions workId={workId} preview={preview} />
            ) : null}
          </div>
        </div>
      )}
    </CreativeContextSection>
  );
}
