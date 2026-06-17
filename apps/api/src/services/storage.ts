import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { nanoid } from "nanoid";
import OSS from "ali-oss";

import { env } from "../env.js";

function localRoot() {
  return resolve(env.storage.localDir);
}

let ossClient: OSS | null = null;

function getOss(): OSS {
  if (!ossClient) {
    const { endpoint, region, bucket, accessKeyId, secretAccessKey } =
      env.storage.oss;
    if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("OSS storage is not configured");
    }
    ossClient = new OSS({
      region,
      accessKeyId,
      accessKeySecret: secretAccessKey,
      bucket,
      endpoint,
      authorizationV4: true,
      secure: true,
    });
  }
  return ossClient;
}

export type UploadFolder = "references" | "avatars" | "covers" | "generated";

function localFileUrl(key: string): string {
  return `${env.publicBaseUrl}/api/files/${key}`;
}

/** OSS 标准公网地址：https://BucketName.Endpoint/ObjectName */
function ossObjectUrl(bucket: string, endpoint: string, key: string): string {
  const endpointUrl = endpoint.startsWith("http")
    ? endpoint
    : `https://${endpoint}`;
  const host = new URL(endpointUrl).hostname;
  return `https://${bucket}.${host}/${key}`;
}

export async function uploadFile(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const key = `${folder}/${filename}`;

  if (env.storage.driver === "oss") {
    const { bucket, endpoint } = env.storage.oss;
    const result = await getOss().put(key, buffer, {
      mime: contentType,
      headers: {
        "Content-Type": contentType,
        "x-oss-object-acl": "public-read",
      },
    });
    const url =
      typeof result.url === "string" && result.url.trim()
        ? result.url.trim()
        : ossObjectUrl(bucket!, endpoint!, key);
    return { url, key };
  }

  const dir = join(localRoot(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return { url: localFileUrl(key), key };
}

export async function readStoredFile(key: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  if (env.storage.driver === "oss") {
    const result = await getOss().get(key);
    const buffer = Buffer.isBuffer(result.content)
      ? result.content
      : Buffer.from(result.content);
    const rawType = result.res?.headers?.["content-type"];
    const contentType =
      typeof rawType === "string" ? rawType : "application/octet-stream";
    return { buffer, contentType };
  }

  const path = join(localRoot(), key);
  const buffer = await readFile(path);
  const ext = key.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "webp"
        ? "image/webp"
        : ext === "png"
          ? "image/png"
          : "application/octet-stream";
  return { buffer, contentType };
}

export function newUploadFilename(originalName: string) {
  const ext = originalName.split(".").pop() || "png";
  return `${nanoid()}.${ext}`;
}
