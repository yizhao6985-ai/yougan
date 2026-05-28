import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { nanoid } from "nanoid";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

import { env } from "../env.js";

function localRoot() {
  return resolve(env.storage.localDir);
}

let s3Client: S3Client | null = null;

function getS3() {
  if (!s3Client) {
    const { endpoint, region, accessKeyId, secretAccessKey } = env.storage.s3;
    if (!endpoint || !accessKeyId || !secretAccessKey || !env.storage.s3.bucket) {
      throw new Error("S3/OSS storage is not configured");
    }
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export type UploadFolder = "references" | "avatars" | "covers";

export async function uploadFile(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const key = `${folder}/${filename}`;

  if (env.storage.driver === "s3") {
    const bucket = env.storage.s3.bucket!;
    await getS3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    const url = `${env.publicBaseUrl}/api/files/${key}`;
    return { url, key };
  }

  const dir = join(localRoot(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  const url = `${env.publicBaseUrl}/api/files/${key}`;
  return { url, key };
}

export async function readStoredFile(key: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  if (env.storage.driver === "s3") {
    const bucket = env.storage.s3.bucket!;
    const response = await getS3().send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return {
      buffer: Buffer.concat(chunks),
      contentType: response.ContentType ?? "application/octet-stream",
    };
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
