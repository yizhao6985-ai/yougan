import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { DiscoverFeedCard } from "@/components/content/discover-feed-card";
import { PublicationArticle } from "@/components/content/publication-article";
import {
  PublicationDetailSkeleton,
  PublicationRelatedSkeleton,
} from "@/components/content/publication-detail-skeleton";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  usePublicationBySlugQuery,
  usePublicationFeedQuery,
} from "@/hooks/queries/publications";
import { DISCOVER_SECTION, discoverBackLabel } from "@/lib/content-section";
import { publicationContentPath } from "@/lib/publication-path";
import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function ContentDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const publicationQuery = usePublicationBySlugQuery(slug);
  const feedQuery = usePublicationFeedQuery();

  const loading = publicationQuery.isLoading;
  const notFound = publicationQuery.isError;
  const publication = publicationQuery.data ?? null;

  const related = useMemo(
    () =>
      (feedQuery.data?.publications ?? [])
        .filter((entry) => entry.slug !== publication?.slug)
        .slice(0, 3),
    [feedQuery.data?.publications, publication?.slug],
  );

  useEffect(() => {
    if (!publication || publication.slug === slug) return;
    navigate(publicationContentPath(publication.slug), { replace: true });
  }, [navigate, publication, slug]);

  const hasRelated = related.length > 0;

  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <main className={cn(scene.pageShell, scene.pageMain)}>
        <div className={scene.articleColumn}>
          <Link
            to="/content"
            className={cn(scene.backLink, "mb-8 inline-flex sm:mb-10")}
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            {discoverBackLabel()}
          </Link>

          {loading ? (
            <PublicationDetailSkeleton />
          ) : notFound || !publication ? (
            <div
              className={cn(scene.surface, "px-6 py-14 text-center sm:px-10")}
            >
              <p className={scene.sectionHint}>{DISCOVER_SECTION.notFound}</p>
              <Button
                type="button"
                className="mt-6 rounded-full"
                size="sm"
                asChild
              >
                <Link to="/content">{DISCOVER_SECTION.continueBrowse}</Link>
              </Button>
            </div>
          ) : (
            <PublicationArticle publication={publication} />
          )}
        </div>

        {!loading && publication ? (
          <>
            {feedQuery.isLoading || hasRelated ? (
              <section
                className={cn(
                  scene.articleDivider,
                  "mt-16 pt-14 sm:mt-20 sm:pt-16",
                )}
              >
                <div className="mb-8 sm:mb-10">
                  <h2 className={scene.sectionHeading}>
                    {DISCOVER_SECTION.moreHeading}
                  </h2>
                  <p className={cn("mt-2", scene.sectionHint)}>
                    {DISCOVER_SECTION.moreHint}
                  </p>
                </div>

                {feedQuery.isLoading ? (
                  <PublicationRelatedSkeleton />
                ) : (
                  <div className={scene.contentGrid3}>
                    {related.map((item) => (
                      <DiscoverFeedCard key={item.id} publication={item} />
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
