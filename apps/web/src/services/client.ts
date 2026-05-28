import { API_BASE_URL, AUTH_TOKEN_KEY } from "@/lib/env";
import { readStoredString, writeStoredString } from "@/lib/storage-value";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getAuthToken() {
  return readStoredString(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  writeStoredString(AUTH_TOKEN_KEY, token);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { workId?: string } = {},
): Promise<T> {
  const { workId, headers, ...rest } = options;
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workId ? { "X-Work-Id": workId } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(response.status, payload?.error ?? response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
