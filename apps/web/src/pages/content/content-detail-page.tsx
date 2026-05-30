import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { PublicationArticle } from "@/components/content/publication-article";
import { PublicationFeedPost } from "@/components/content/publication-feed-post";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  usePublicationBySlugQuery,
  usePublicationFeedQuery,
} from "@/hooks/queries/publications";
import { scene } from "@/lib/scene-styles";
import { DISCOVER_SECTION, discoverBackLabel } from "@/lib/content-section";

export function ContentDetailPage() {
  const { slug = "" } = useParams();
  const publicationQuery = usePublicationBySlugQuery(slug);
  const feedQuery = usePublicationFeedQuery();

  const loading = publicationQuery.isLoading || feedQuery.isLoading;
  const notFound = publicationQuery.isError;
  const publication = publicationQuery.data ?? null;

  const related = useMemo(
    () =>
      (feedQuery.data?.publications ?? [])
        .filter((entry) => entry.slug !== slug)
        .slice(0, 5),
    [feedQuery.data?.publications, slug],
  );

  const hasRelated = related.length > 0;

  return (
    <div className={scene.app}>
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <Button type="button" variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/content">
            <ArrowLeftIcon className="size-4" />
            {discoverBackLabel()}
          </Link>
        </Button>

        {loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : notFound || !publication ? (
          <div className="rounded-lg border border-dashed border-border bg-card/80 p-10 text-center">
            <p className="text-sm text-muted-foreground">{DISCOVER_SECTION.notFound}</p>
            <Button type="button" className="mt-4" size="sm" asChild>
              <Link to="/content">{DISCOVER_SECTION.continueBrowse}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-lg border border-border/80 bg-card p-5 shadow-sm shadow-border/25 sm:p-8">
              <PublicationArticle publication={publication} />
            </div>

            {hasRelated ? (
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {DISCOVER_SECTION.moreHeading}
                </h2>
                {related.map((item) => (
                  <PublicationFeedPost
                    key={item.id}
                    publication={item}
                    compact
                  />
                ))}
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
