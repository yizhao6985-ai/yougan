import JSZip from "jszip";
import {
  previewImages,
  previewPlainText,
  type WorkPreview,
} from "@yougan/domain";

import { resolveReferenceAssetUrl } from "@/lib/reference-asset-url";

type MediaAsset = {
  folder: "images" | "audio" | "videos";
  index: number;
  url: string;
  posterUrl?: string | null;
};

const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned || "作品";
}

function extensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url, "http://local").pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function extensionFromContentType(contentType: string): string {
  const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return CONTENT_TYPE_EXTENSION[base] ?? "bin";
}

function resolveAssetFilename(
  url: string,
  contentType: string,
  index: number,
): string {
  const ext = extensionFromUrl(url) ?? extensionFromContentType(contentType);
  return `${String(index).padStart(2, "0")}.${ext}`;
}

async function fetchAsset(
  url: string,
): Promise<{ data: ArrayBuffer; contentType: string }> {
  const resolved = resolveReferenceAssetUrl(url) ?? url;
  const response = await fetch(resolved);
  if (!response.ok) {
    throw new Error(`资源下载失败（${response.status}）`);
  }
  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  return { data: await response.arrayBuffer(), contentType };
}

function collectMediaAssets(preview: WorkPreview): MediaAsset[] {
  const assets: MediaAsset[] = [];
  let imageIndex = 0;

  for (const image of previewImages(preview)) {
    if (!image.url.trim()) continue;
    imageIndex += 1;
    assets.push({
      folder: "images",
      index: imageIndex,
      url: image.url.trim(),
    });
  }

  return assets;
}

function buildPreviewMarkdown(preview: WorkPreview): string {
  const lines: string[] = [];

  if (preview.title?.trim()) {
    lines.push(`# ${preview.title.trim()}`);
  }
  if (preview.hook?.trim()) {
    lines.push("", preview.hook.trim());
  }

  const body = previewPlainText(preview);
  if (body) {
    lines.push("", body);
  }

  for (const image of previewImages(preview)) {
    if (image.alt?.trim()) {
      lines.push("", `![${image.alt.trim()}](${image.url})`);
    }
  }

  if (preview.hashtags?.length) {
    lines.push(
      "",
      preview.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" "),
    );
  }

  if (preview.notes?.trim()) {
    lines.push("", "---", "", `_备注：${preview.notes.trim()}_`);
  }

  const markdown = lines.join("\n").trim();
  return markdown ? `${markdown}\n` : "";
}

async function addMediaToZip(zip: JSZip, assets: MediaAsset[]): Promise<void> {
  await Promise.all(
    assets.map(async (asset) => {
      const { data, contentType } = await fetchAsset(asset.url);
      const filename = resolveAssetFilename(
        asset.url,
        contentType,
        asset.index,
      );
      zip.file(`${asset.folder}/${filename}`, data);

      if (asset.posterUrl?.trim()) {
        try {
          const poster = await fetchAsset(asset.posterUrl);
          const posterFilename = resolveAssetFilename(
            asset.posterUrl,
            poster.contentType,
            asset.index,
          ).replace(/(\.[a-z0-9]+)$/i, "-poster$1");
          zip.file(`${asset.folder}/${posterFilename}`, poster.data);
        } catch {
          // 封面下载失败不影响主文件
        }
      }
    }),
  );
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadPreviewAsZip(
  preview: WorkPreview,
  options?: { filename?: string },
): Promise<void> {
  const zip = new JSZip();
  const assets = collectMediaAssets(preview);

  const markdown = buildPreviewMarkdown(preview);
  if (markdown) {
    zip.file("内容.md", markdown);
  }

  await addMediaToZip(zip, assets);

  const baseName = sanitizeFilename(options?.filename ?? preview.title ?? "作品");
  const blob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload(blob, `${baseName}.zip`);
}
