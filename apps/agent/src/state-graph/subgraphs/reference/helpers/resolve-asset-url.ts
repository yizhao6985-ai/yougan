import type { WorkReference } from "@yougan/domain";
import { listReferenceAssetUrls } from "@yougan/domain";

export function resolveReferenceAssetUrl(
  candidate: string,
  messageUrls: string[],
  knownUrls: string[],
): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  const pools = [messageUrls, knownUrls];
  for (const pool of pools) {
    const exact = pool.find((url) => url === trimmed);
    if (exact) return exact;
  }

  for (const pool of pools) {
    const fuzzy = pool.find(
      (url) => url.endsWith(trimmed) || trimmed.endsWith(url),
    );
    if (fuzzy) return fuzzy;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return null;
}

export function listKnownReferenceAssetUrls(
  references: WorkReference[],
): string[] {
  return listReferenceAssetUrls(references);
}
