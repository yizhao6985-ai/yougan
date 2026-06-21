import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { DiscoverControls } from "@/components/content/discover-controls";
import { DiscoverEmptyState } from "@/components/content/discover-empty-state";
import { DiscoverFeaturedRail } from "@/components/content/discover-featured-rail";
import { DiscoverFeedCard } from "@/components/content/discover-feed-card";
import { DiscoverFeedSkeleton } from "@/components/content/discover-feed-skeleton";
import { DiscoverPageHeader } from "@/components/content/discover-page-header";
import { DiscoverPromoBanner } from "@/components/content/discover-promo-banner";
import { SiteHeader } from "@/components/site-header";
import { usePublicationFeedQuery } from "@/hooks/queries/publications";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { pickFeaturedPublications } from "@/lib/discover-grid-layout";
import { scene } from "@/lib/scene-styles";
import {
  buildDiscoverSearchParams,
  EMPTY_DISCOVER_FILTERS,
  parseDiscoverFilters,
  type DiscoverFilters,
} from "@/lib/discover-filters";
import { type DiscoverFacets } from "@yougan/domain";
import { cn } from "@/lib/utils";

const EMPTY_FACETS: DiscoverFacets = {
  contentFormat: [],
  topicCategory: [],
  mediaType: [],
};

export function ContentFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseDiscoverFilters(searchParams);
  const hasActiveFilters =
    searchParams.toString() !==
    buildDiscoverSearchParams(EMPTY_DISCOVER_FILTERS).toString();

  const { data, isLoading, isError } = usePublicationFeedQuery(filters);
  const publications = data?.publications ?? [];
  const facets = data?.facets ?? EMPTY_FACETS;
  const total = data?.total ?? 0;

  const { featured, rest } = useMemo(
    () => pickFeaturedPublications(publications),
    [publications],
  );

  const handleFiltersChange = (next: DiscoverFilters) => {
    setSearchParams(buildDiscoverSearchParams(next), { replace: true });
  };

  const showControls = !isLoading && !isError;
  const showEditorial = featured.length > 0;

  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <main className={cn(scene.pageShell, scene.pageMainCompact)}>
        <DiscoverPageHeader total={total} loading={isLoading} />

        <div className="mt-5">
          <DiscoverPromoBanner />
        </div>

        {showControls ? (
          <div className={cn(scene.discoverFilterSticky, "mt-5")}>
            <DiscoverControls
              filters={filters}
              facets={facets}
              onChange={handleFiltersChange}
            />
          </div>
        ) : null}

        <div className="mt-8">
          {isLoading ? (
            <DiscoverFeedSkeleton />
          ) : isError ? (
            <div className={scene.settingsPanelCard}>
              <p className="text-sm text-destructive">
                {DISCOVER_SECTION.loadError}
              </p>
            </div>
          ) : publications.length === 0 ? (
            <DiscoverEmptyState
              filtered={hasActiveFilters}
              onClearFilters={
                hasActiveFilters
                  ? () => handleFiltersChange({})
                  : undefined
              }
            />
          ) : (
            <div className="space-y-10">
              {showEditorial ? (
                <DiscoverFeaturedRail publications={featured} />
              ) : null}

              {rest.length > 0 ? (
                <section aria-label={DISCOVER_SECTION.title}>
                  <div className={scene.discoverFeedGrid}>
                    {rest.map((publication) => (
                      <DiscoverFeedCard
                        key={publication.id}
                        publication={publication}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
