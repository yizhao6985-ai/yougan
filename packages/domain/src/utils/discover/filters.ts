import {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
} from "../../models/content/catalog.js";
import {
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  EMPTY_DISCOVER_FILTERS,
  type DiscoverFilters,
} from "../../models/discover/taxonomy.js";

export { EMPTY_DISCOVER_FILTERS };

export function parseDiscoverFilters(
  searchParams: URLSearchParams,
): DiscoverFilters {
  const filters: DiscoverFilters = {};
  const platform = searchParams.get("platform");
  const contentFormat = searchParams.get("format");
  const topicCategory = searchParams.get("topic");
  const mediaType = searchParams.get("media");

  if (platform && DISCOVER_PLATFORMS.some((item) => item.id === platform)) {
    filters.platform = platform;
  }
  if (
    contentFormat &&
    CONTENT_FORMATS.some((item) => item.id === contentFormat)
  ) {
    filters.contentFormat = contentFormat;
  }
  if (
    topicCategory &&
    DISCOVER_TOPIC_CATEGORIES.some((item) => item.id === topicCategory)
  ) {
    filters.topicCategory = topicCategory;
  }
  if (mediaType && MEDIA_MODALITIES.some((item) => item.id === mediaType)) {
    filters.mediaType = mediaType;
  }

  return filters;
}

export function buildDiscoverSearchParams(filters: DiscoverFilters) {
  const params = new URLSearchParams();
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.contentFormat) params.set("format", filters.contentFormat);
  if (filters.topicCategory) params.set("topic", filters.topicCategory);
  if (filters.mediaType) params.set("media", filters.mediaType);
  return params;
}

export function countActiveDiscoverFilters(filters: DiscoverFilters) {
  return Object.values(filters).filter(Boolean).length;
}

export function clearDiscoverFilterKey(
  filters: DiscoverFilters,
  key: keyof DiscoverFilters,
): DiscoverFilters {
  const next = { ...filters };
  delete next[key];
  return next;
}

export function mergeDiscoverFilters(
  base: DiscoverFilters,
  patch: DiscoverFilters,
): DiscoverFilters {
  return { ...base, ...patch };
}
