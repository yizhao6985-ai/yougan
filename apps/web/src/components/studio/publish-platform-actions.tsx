import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublishConfirmDialog } from "@/components/studio/publish-confirm-dialog";
import {
  useMyPublicationsQuery,
  usePublishWorkMutation,
} from "@/hooks/queries/publications";
import { DISCOVER_SECTION } from "@/lib/content-section";
import type { PublicationMetadataOverrides } from "@/lib/discover-taxonomy";
import { PUBLISH, STUDIO } from "@/lib/site-copy";
import type { WorkDraft } from "@/lib/types";

export function PublishPlatformActions({
  workId,
  draft,
}: {
  workId: string;
  draft?: WorkDraft | null;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: publications = [], isLoading } = useMyPublicationsQuery();
  const publishMutation = usePublishWorkMutation();

  const publication = useMemo(
    () =>
      publications.find(
        (item) => item.workId === workId && item.status !== "archived",
      ) ?? null,
    [publications, workId],
  );

  const handlePublish = async (metadata: PublicationMetadataOverrides) => {
    await publishMutation.mutateAsync({ workId, publish: true, metadata });
    setDialogOpen(false);
  };

  if (!draft?.body) return null;
  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground/70">{PUBLISH.checking}</p>
    );
  }

  if (publication?.status === "published") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {PUBLISH.publishedBadge}
        </span>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={`/content/${publication.slug}`}>
            <ExternalLinkIcon className="size-3.5" />
            {STUDIO.publishViewInDiscover(DISCOVER_SECTION.title)}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {publication?.status === "draft" ? (
          <span className="rounded-md bg-accent px-2.5 py-1 text-xs text-primary">
            {PUBLISH.draftBadge}
          </span>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={publishMutation.isPending}
          onClick={() => setDialogOpen(true)}
        >
          {publishMutation.isPending ? PUBLISH.publishing : PUBLISH.publishButton}
        </Button>
      </div>

      <PublishConfirmDialog
        workId={workId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handlePublish}
        isSubmitting={publishMutation.isPending}
      />
    </>
  );
}
