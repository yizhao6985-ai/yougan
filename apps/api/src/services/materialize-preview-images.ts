import { nanoid } from "nanoid";
import type {
  ImagePreviewBlock,
  PreviewBlock,
  WorkPreviewImage,
  WorkProduction,
} from "@yougan/domain";
import { parsePreviewBlocks } from "@yougan/domain";

import { env } from "../env.js";
import { uploadFile } from "./storage.js";

function isOurStorageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    const publicBase = new URL(env.publicBaseUrl);
    if (
      parsed.protocol === publicBase.protocol &&
      parsed.host === publicBase.host &&
      parsed.pathname.startsWith("/api/files/")
    ) {
      return true;
    }

    if (env.storage.driver === "oss") {
      const { bucket, endpoint } = env.storage.oss;
      if (bucket && endpoint) {
        const endpointUrl = endpoint.startsWith("http")
          ? endpoint
          : `https://${endpoint}`;
        const host = new URL(endpointUrl).hostname;
        if (parsed.hostname === `${bucket}.${host}`) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

function imageNeedsMaterialize(image: {
  url?: string;
  transient?: boolean;
}): boolean {
  const url = image.url?.trim();
  if (!url) return false;
  if (isOurStorageUrl(url)) return false;
  return image.transient === true || url.startsWith("http");
}

function contentTypeFromBuffer(buffer: Buffer, headerType: string | null): string {
  const header = headerType?.split(";")[0]?.trim().toLowerCase();
  if (header?.startsWith("image/")) return header;

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return "image/jpeg";
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function persistRemoteImage(sourceUrl: string): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`FETCH_TRANSIENT_IMAGE_FAILED: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = contentTypeFromBuffer(
    buffer,
    response.headers.get("content-type"),
  );
  const filename = `${nanoid()}.${extensionForContentType(contentType)}`;
  const uploaded = await uploadFile(
    buffer,
    "generated",
    filename,
    contentType,
  );
  return uploaded.url;
}

async function materializePreviewImage(
  image: WorkPreviewImage,
): Promise<WorkPreviewImage> {
  if (!imageNeedsMaterialize(image)) {
    const { transient: _transient, ...stable } = image;
    return stable;
  }

  try {
    const url = await persistRemoteImage(image.url.trim());
    return {
      url,
      alt: image.alt ?? null,
      prompt: image.prompt ?? null,
    };
  } catch (error) {
    console.error("[materialize-preview-images] failed to persist image", {
      url: image.url,
      error,
    });
    return image;
  }
}

async function materializeImageBlock(
  block: ImagePreviewBlock,
): Promise<ImagePreviewBlock> {
  const materialized = await materializePreviewImage({
    url: block.url,
    alt: block.alt,
    prompt: block.prompt,
    transient: block.transient,
  });
  return {
    ...block,
    url: materialized.url,
    alt: materialized.alt ?? null,
    prompt: materialized.prompt ?? null,
    transient: undefined,
  };
}

async function materializeImageList(
  images: WorkPreviewImage[] | undefined,
): Promise<WorkPreviewImage[] | undefined> {
  if (!images?.length) return images;
  return Promise.all(images.map(materializePreviewImage));
}

async function materializePreviewBlocks(
  blocks: PreviewBlock[] | undefined,
): Promise<PreviewBlock[] | undefined> {
  if (!blocks?.length) return blocks;
  return Promise.all(
    blocks.map(async (block) => {
      if (block.type !== "image") return block;
      return materializeImageBlock(block);
    }),
  );
}

/** 将 production 内外部临时配图物化到自有 storage（写库前调用）。 */
export async function materializeWorkProductionImages(
  production: WorkProduction,
): Promise<WorkProduction> {
  const preview = production.preview
    ? {
        ...production.preview,
        blocks:
          (await materializePreviewBlocks(production.preview.blocks)) ??
          production.preview.blocks,
      }
    : production.preview;

  const pending_tasks = await Promise.all(
    (production.pending_tasks ?? []).map(async (task) => {
      if (!task.deliverable?.images?.length) return task;
      const images = await materializeImageList(task.deliverable.images);
      return {
        ...task,
        deliverable: {
          ...task.deliverable,
          images,
        },
      };
    }),
  );

  return {
    ...production,
    preview,
    pending_tasks,
  };
}

/** Agent run 落库前：物化 values.production 中的临时配图。 */
export async function materializeAgentRunValues(
  values: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const production = values.production;
  if (!production || typeof production !== "object") {
    return values;
  }

  const materialized = await materializeWorkProductionImages(
    production as WorkProduction,
  );

  return {
    ...values,
    production: materialized,
  };
}

export function parsePublicationBlocks(raw: unknown): PreviewBlock[] {
  return parsePreviewBlocks(raw);
}
