import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { DiscoverControls } from "@/components/content/discover-controls";
import { DiscoverEmptyState } from "@/components/content/discover-empty-state";
import { DiscoverFeaturedHero } from "@/components/content/discover-featured-hero";
import { DiscoverFeedCard } from "@/components/content/discover-feed-card";
import { DiscoverFeedSkeleton } from "@/components/content/discover-feed-skeleton";
import { DiscoverPageHeader } from "@/components/content/discover-page-header";
import {
  MarketingPageShell,
  MarketingSection,
} from "@/components/marketing/marketing-page-layout";
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
import { type DiscoverFacets } from "@/lib/discover-taxonomy";

const EMPTY_FACETS: DiscoverFacets = {
  platform: [],
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

  const { featured, rest } = useMemo(() => {
    if (hasActiveFilters) {
      return { featured: [] as typeof publications, rest: publications };
    }
    return pickFeaturedPublications(publications);
  }, [hasActiveFilters, publications]);

  const handleFiltersChange = (next: DiscoverFilters) => {
    const params = buildDiscoverSearchParams(next);
    setSearchParams(params, { replace: true });
  };

  const showControls = !isLoading && !isError;

  return (
    <div className={scene.marketing}>
      <SiteHeader />

      <MarketingPageShell>
        <DiscoverPageHeader total={total} loading={isLoading} />

        {showControls ? (
          <DiscoverControls
            filters={filters}
            facets={facets}
            onChange={handleFiltersChange}
          />
        ) : null}

        <div className="mt-10">
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
            <div className={scene.sectionStack}>
              {featured[0] ? (
                <DiscoverFeaturedHero publication={featured[0]} />
              ) : null}

              {rest.length > 0 ? (
                <MarketingSection
                  title={
                    hasActiveFilters
                      ? `筛选结果 · ${total} 篇`
                      : featured[0]
                        ? DISCOVER_SECTION.moreHeading
                        : DISCOVER_SECTION.title
                  }
                >
                  <div className={scene.contentGrid4}>
                    {rest.map((publication) => (
                      <DiscoverFeedCard
                        key={publication.id}
                        publication={publication}
                      />
                    ))}
                  </div>
                </MarketingSection>
              ) : null}
            </div>
          )}
        </div>
      </MarketingPageShell>
    </div>
  );
}
