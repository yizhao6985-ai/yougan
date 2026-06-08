import type { Asset } from "@/lib/types";
import { apiFetch } from "@/services/client";

export type UploadPurpose = "reference" | "avatar" | "cover";

export type UploadResponse = {
  purpose: UploadPurpose;
  asset: Asset;
  url: string;
  key: string;
};

export async function uploadImage(file: File, purpose: UploadPurpose) {
  const body = new FormData();
  body.append("file", file);
  body.append("purpose", purpose);
  return apiFetch<UploadResponse>("/api/upload", {
    method: "POST",
    body,
  });
}
