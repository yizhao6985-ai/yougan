import { DISCOVER_SECTION } from "@/lib/content-section";
import type { Publication } from "@/lib/publication-types";

import { DiscoverFeedCard } from "./discover-feed-card";

export function DiscoverFeaturedRail({
  publications,
}: {
  publications: Publication[];
}) {
  if (!publications.length) return null;

  return (
    <section aria-label={DISCOVER_SECTION.featuredHeading}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          {DISCOVER_SECTION.featuredHeading}
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {DISCOVER_SECTION.featuredHint}
        </p>
      </div>

      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 sm:-mx-0 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {publications.map((publication) => (
          <div
            key={publication.id}
            className="w-[min(78vw,19rem)] shrink-0 snap-start sm:w-[17.5rem]"
          >
            <DiscoverFeedCard publication={publication} featured />
          </div>
        ))}
      </div>
    </section>
  );
}
