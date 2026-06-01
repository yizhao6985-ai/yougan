import { MarkdownContent } from "@/components/markdown-content";
import {
  CreativeContextEmpty,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { PublishPlatformActions } from "@/components/studio/publish-platform-actions";
import { PREVIEW_PANEL } from "@/lib/site-copy";
import type { WorkDraft } from "@/lib/types";

export function ContentPreview({
  workId,
  draft,
  compact = false,
}: {
  workId?: string;
  draft?: WorkDraft | null;
  compact?: boolean;
}) {
  return (
    <CreativeContextSection
      title={PREVIEW_PANEL.title}
      hint={PREVIEW_PANEL.hint}
      compact={compact}
    >
      {!draft?.body ? (
        <CreativeContextEmpty>{PREVIEW_PANEL.empty}</CreativeContextEmpty>
      ) : (
        <div className="space-y-4 rounded-lg border border-border/80 bg-background/80 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {draft.platform}
            </p>
            {draft.title ? (
              <h4 className="mt-1.5 text-pretty text-lg font-semibold leading-7 text-foreground">
                {draft.title}
              </h4>
            ) : null}
          </div>
          <MarkdownContent content={draft.body} />
          {draft.hashtags?.length ? (
            <div className="flex flex-wrap gap-2">
              {draft.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-accent px-2 py-1 text-xs text-primary"
                >
                  #{tag.replace(/^#/, "")}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(draft.body)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground/90 transition hover:bg-muted"
            >
              复制文案
            </button>
          </div>
          {workId ? (
            <PublishPlatformActions workId={workId} draft={draft} />
          ) : null}
        </div>
      )}
    </CreativeContextSection>
  );
}
