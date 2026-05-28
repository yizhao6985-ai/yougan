import { MarkdownContent } from "@/components/markdown-content";
import {
  CreativeContextEmpty,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { PublishPlatformActions } from "@/components/studio/publish-platform-actions";
import { PREVIEW_PANEL } from "@/lib/site-copy";
import type { GeneratedContent } from "@/lib/types";

export function ContentPreview({
  workId,
  creation,
}: {
  workId?: string;
  creation?: GeneratedContent | null;
}) {
  return (
    <CreativeContextSection title={PREVIEW_PANEL.title} hint={PREVIEW_PANEL.hint}>
      {!creation?.body ? (
        <CreativeContextEmpty>{PREVIEW_PANEL.empty}</CreativeContextEmpty>
      ) : (
        <div className="space-y-4 rounded-xl border border-border/80 bg-background/80 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {creation.platform}
            </p>
            {creation.title ? (
              <h4 className="mt-1.5 text-pretty text-lg font-semibold leading-7 text-foreground">
                {creation.title}
              </h4>
            ) : null}
          </div>
          <MarkdownContent content={creation.body} />
          {creation.hashtags?.length ? (
            <div className="flex flex-wrap gap-2">
              {creation.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent px-2 py-1 text-xs text-primary"
                >
                  #{tag.replace(/^#/, "")}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(creation.body)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground/90 transition hover:bg-muted"
            >
              复制文案
            </button>
          </div>
          {workId ? (
            <PublishPlatformActions workId={workId} creation={creation} />
          ) : null}
        </div>
      )}
    </CreativeContextSection>
  );
}
