import {
  CONTENT_FORMATS,
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  EMPTY_DISCOVER_FILTERS,
  MEDIA_MODALITIES,
  type DiscoverFilters,
} from "@yougan/domain";

export { EMPTY_DISCOVER_FILTERS, type DiscoverFilters };

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
  const modality = MEDIA_MODALITIES.find((item) => item.id === mediaType);
  if (modality) {
    filters.mediaType = modality.id;
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
