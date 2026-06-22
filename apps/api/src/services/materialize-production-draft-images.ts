import { nanoid } from "nanoid";
import type {
  PreviewImage,
  WorkPreview,
  WorkProduction,
  ProductionDraftImage,
} from "@yougan/domain";
import { parseWorkPreview } from "@yougan/domain";

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

async function materializeDraftImage(
  image: ProductionDraftImage,
): Promise<ProductionDraftImage> {
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
    console.error(
      "[materialize-production-draft-images] failed to persist image",
      {
        url: image.url,
        error,
      },
    );
    return image;
  }
}

async function materializePreviewImage(
  image: PreviewImage,
): Promise<PreviewImage> {
  const materialized = await materializeDraftImage({
    url: image.url,
    alt: image.alt,
    prompt: image.prompt,
    transient: image.transient,
  });
  return {
    ...image,
    url: materialized.url,
    alt: materialized.alt ?? null,
    prompt: materialized.prompt ?? null,
    transient: undefined,
  };
}

async function materializeDraftImageList(
  images: ProductionDraftImage[] | undefined,
): Promise<ProductionDraftImage[] | undefined> {
  if (!images?.length) return images;
  return Promise.all(images.map(materializeDraftImage));
}

/** 将 production 任务 deliverable 与顶层 preview 的临时配图物化到自有 storage。 */
export async function materializeWorkProductionImages(
  production: WorkProduction,
): Promise<WorkProduction> {
  const pending_tasks = await Promise.all(
    (production.pending_tasks ?? []).map(async (task) => {
      if (!task.deliverable?.images?.length) return task;
      const images = await materializeDraftImageList(task.deliverable.images);
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
    pending_tasks,
  };
}

export async function materializeWorkPreviewImages(
  preview: WorkPreview | null,
): Promise<WorkPreview | null> {
  if (!preview) return preview;
  const normalized =
    parseWorkPreview(preview) ??
    (preview.content ? preview : null);
  if (!normalized?.content) return preview;

  const content = normalized.content;
  if (content.kind === "illustration") {
    return {
      ...normalized,
      content: {
        ...content,
        images: await Promise.all(content.images.map(materializePreviewImage)),
      },
    };
  }

  if (content.kind === "note") {
    return {
      ...normalized,
      content: {
        ...content,
        images: await Promise.all(content.images.map(materializePreviewImage)),
      },
    };
  }

  if ("body" in content) {
    const images = content.images
      ? await Promise.all(content.images.map(materializePreviewImage))
      : content.images;
    return {
      ...normalized,
      content: {
        ...content,
        images,
      },
    };
  }

  return normalized;
}

/** Agent run 落库前：物化 values 中的临时配图。 */
export async function materializeAgentRunValues(
  values: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const next = { ...values };

  if (values.production && typeof values.production === "object") {
    next.production = await materializeWorkProductionImages(
      values.production as WorkProduction,
    );
  }

  if (values.preview && typeof values.preview === "object") {
    next.preview = await materializeWorkPreviewImages(
      values.preview as WorkPreview,
    );
  }

  return next;
}
