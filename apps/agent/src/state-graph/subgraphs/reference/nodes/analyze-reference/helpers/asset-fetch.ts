export function isPublicReferenceAssetUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchReferenceAssetBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FETCH_REFERENCE_ASSET_FAILED: ${response.status}`);
  }
  const bytes = await response.arrayBuffer();
  return Buffer.from(bytes);
}

export function referenceAssetFileExtension(
  mimeType: string,
  originalName?: string | null,
): string {
  const fromName = originalName?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;

  const mime = mimeType.toLowerCase();
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("quicktime")) return "mov";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "bin";
}
