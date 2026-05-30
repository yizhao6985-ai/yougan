import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArchiveIcon,
  ExternalLinkIcon,
  Trash2Icon,
} from "lucide-react";

import {
  SettingsEmptyState,
  SettingsPageHeader,
  SettingsPanelCard,
} from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import {
  useDeletePublicationMutation,
  useMyPublicationsQuery,
  useUpdatePublicationStatusMutation,
} from "@/hooks/queries/publications";
import { formatPublishedAt, platformLabel } from "@/lib/platform-labels";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { PUBLISH, SETTINGS } from "@/lib/site-copy";
import {
  formatLabel,
  topicCategoryLabel,
} from "@/lib/discover-taxonomy";
import {
  PUBLICATION_STATUS_LABELS,
  type PublicationStatus,
} from "@/lib/publication-types";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: "all" | PublicationStatus; label: string }> = [
  { value: "all", label: "全部" },
  { value: "published", label: "已发布" },
  { value: "draft", label: "草稿" },
  { value: "archived", label: "已归档" },
];

export function PublicationsSettingsPanel() {
  const [filter, setFilter] = useState<"all" | PublicationStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: publications = [], isLoading } = useMyPublicationsQuery();
  const updateStatusMutation = useUpdatePublicationStatusMutation();
  const deletePublicationMutation = useDeletePublicationMutation();

  const filtered = useMemo(() => {
    if (filter === "all") return publications;
    return publications.filter((item) => item.status === filter);
  }, [filter, publications]);

  const runAction = async (
    publicationId: string,
    action: () => Promise<unknown>,
  ) => {
    setBusyId(publicationId);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="发布管理"
        description={SETTINGS.publicationsIntro(DISCOVER_SECTION.title)}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition",
              filter === item.value
                ? "bg-secondary font-medium text-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">加载中…</p>
      ) : filtered.length === 0 ? (
        <SettingsEmptyState
          message={PUBLISH.emptyPublications}
          action={
            <Button type="button" size="sm" asChild>
              <Link to="/studio">{PUBLISH.goPublish}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((publication) => {
            const busy = busyId === publication.id;
            const cover =
              publication.coverUrl ||
              (publication.images?.[0] as { url?: string } | undefined)?.url;

            return (
              <li key={publication.id}>
                <SettingsPanelCard className="p-0">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                    {cover ? (
                      <div className="shrink-0 overflow-hidden rounded-lg border border-border/80 sm:w-36">
                        <img
                          src={cover}
                          alt=""
                          className="aspect-[4/3] w-full object-cover sm:aspect-square sm:size-28"
                        />
                      </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 font-medium",
                            publication.status === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : publication.status === "draft"
                                ? "bg-accent text-primary"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {PUBLICATION_STATUS_LABELS[publication.status]}
                        </span>
                        <span>{platformLabel(publication.platform)}</span>
                        {formatLabel(publication.contentFormat) ? (
                          <span>{formatLabel(publication.contentFormat)}</span>
                        ) : null}
                        {topicCategoryLabel(publication.topicCategory) ? (
                          <span>
                            {topicCategoryLabel(publication.topicCategory)}
                          </span>
                        ) : null}
                        {publication.publishedAt ? (
                          <span>{formatPublishedAt(publication.publishedAt)}</span>
                        ) : null}
                      </div>

                      <h2 className="mt-2 text-base font-semibold text-foreground">
                        {publication.title}
                      </h2>
                      {publication.excerpt ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {publication.excerpt}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:w-36 sm:flex-col sm:items-stretch">
                      {publication.status === "published" ? (
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Link to={`/content/${publication.slug}`}>
                            <ExternalLinkIcon className="size-3.5" />
                            查看
                          </Link>
                        </Button>
                      ) : null}

                      {publication.status !== "published" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void runAction(publication.id, () =>
                              updateStatusMutation.mutateAsync({
                                publicationId: publication.id,
                                status: "published",
                              }),
                            )
                          }
                        >
                          发布
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void runAction(publication.id, () =>
                              updateStatusMutation.mutateAsync({
                                publicationId: publication.id,
                                status: "draft",
                              }),
                            )
                          }
                        >
                          下架
                        </Button>
                      )}

                      {publication.status !== "archived" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void runAction(publication.id, () =>
                              updateStatusMutation.mutateAsync({
                                publicationId: publication.id,
                                status: "archived",
                              }),
                            )
                          }
                        >
                          <ArchiveIcon className="size-3.5" />
                          归档
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `确定删除「${publication.title}」吗？此操作不可恢复。`,
                            )
                          ) {
                            return;
                          }
                          void runAction(publication.id, () =>
                            deletePublicationMutation.mutateAsync(publication.id),
                          );
                        }}
                      >
                        <Trash2Icon className="size-3.5" />
                        删除
                      </Button>
                    </div>
                  </div>
                </SettingsPanelCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
