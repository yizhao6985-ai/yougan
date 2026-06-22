import type { Publication } from "@/lib/publication-types";

export function pickFeaturedPublications(
  publications: Publication[],
  limit = 2,
) {
  if (publications.length === 0) {
    return { featured: [] as Publication[], rest: [] as Publication[] };
  }

  const withVisual = publications.filter(
    (item) =>
      item.coverUrl?.trim() ||
      (item.excerpt?.trim().length ?? 0) > 40,
  );
  const pool = withVisual.length > 0 ? withVisual : publications;
  const featured = pool.slice(0, Math.min(limit, pool.length));
  const featuredIds = new Set(featured.map((item) => item.id));

  return {
    featured,
    rest: publications.filter((item) => !featuredIds.has(item.id)),
  };
}
