import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  FeaturedPublicationCard,
  pickFeaturedPublications,
} from "@/components/content/featured-publication-card";
import { DiscoverIntentEntries } from "@/components/content/discover-intent-entries";
import { DiscoverFiltersPanel } from "@/components/content/discover-filters-panel";
import { PublicationFeedPost } from "@/components/content/publication-feed-post";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { usePublicationFeedQuery } from "@/hooks/queries/publications";
import { DISCOVER_SECTION } from "@/lib/content-section";
import { scene } from "@/lib/scene-styles";
import { BRAND } from "@/lib/site-copy";
import {
  buildDiscoverSearchParams,
  EMPTY_DISCOVER_FILTERS,
  parseDiscoverFilters,
  type DiscoverFilters,
} from "@/lib/discover-filters";
import { type DiscoverFacets } from "@/lib/discover-taxonomy";
import type { Publication } from "@/lib/publication-types";

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
      return { featured: [] as Publication[], rest: publications };
    }
    return pickFeaturedPublications(publications);
  }, [hasActiveFilters, publications]);

  const handleFiltersChange = (next: DiscoverFilters) => {
    const params = buildDiscoverSearchParams(next);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className={scene.app}>
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
            {BRAND.en}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {DISCOVER_SECTION.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {DISCOVER_SECTION.description}
          </p>
        </div>

        {!isLoading && !isError ? (
          <div className="mb-6 space-y-5">
            <DiscoverIntentEntries
              filters={filters}
              onChange={handleFiltersChange}
            />
            <DiscoverFiltersPanel
              filters={filters}
              facets={facets}
              total={total}
              onChange={handleFiltersChange}
            />
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : isError ? (
          <p className="text-sm text-red-600">{DISCOVER_SECTION.loadError}</p>
        ) : publications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/80 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? DISCOVER_SECTION.emptyFiltered
                : DISCOVER_SECTION.emptyDefault}
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                className="mt-4"
                size="sm"
                variant="outline"
                onClick={() => handleFiltersChange({})}
              >
                {DISCOVER_SECTION.clearFilters}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-8">
            {featured.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-foreground/90">
                  {DISCOVER_SECTION.featuredHeading}
                </h2>
                <div className="space-y-4">
                  {featured.map((publication) => (
                    <FeaturedPublicationCard
                      key={publication.id}
                      publication={publication}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {rest.length > 0 ? (
              <section className="space-y-4">
                {featured.length > 0 ? (
                  <h2 className="text-sm font-medium text-foreground/90">
                    {DISCOVER_SECTION.moreHeading}
                  </h2>
                ) : null}
                <div className="space-y-4">
                  {rest.map((publication) => (
                    <PublicationFeedPost
                      key={publication.id}
                      publication={publication}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
