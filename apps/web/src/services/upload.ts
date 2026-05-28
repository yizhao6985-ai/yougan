import { apiFetch } from "@/services/client";

export type UploadPurpose = "reference" | "avatar" | "cover";

export async function uploadImage(file: File, purpose: UploadPurpose) {
  const body = new FormData();
  body.append("file", file);
  body.append("purpose", purpose);
  return apiFetch<{ url: string; key: string; purpose: UploadPurpose }>(
    "/api/upload",
    { method: "POST", body },
  );
}
