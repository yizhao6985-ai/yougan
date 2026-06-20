import { apiFetch, setAuthToken } from "@/services/client";
import { ACTIVE_WORK_KEY } from "@/lib/env";
import { writeStoredString } from "@/lib/storage-value";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  hasPassword: boolean;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
};

export async function register(input: {
  login: string;
  password: string;
  name?: string;
}) {
  return apiFetch<{ token: string; user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function login(loginId: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: loginId, password }),
  });
}

export async function sendSmsCode(phone: string) {
  return apiFetch<{
    ok: true;
    cooldownSeconds: number;
    devCode?: string;
  }>("/api/auth/sms/send", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function loginWithSms(phone: string, code: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/api/auth/sms/login", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export async function logout() {
  try {
    await apiFetch<void>("/api/auth/logout", { method: "POST" });
  } catch {
    // 本地会话仍应清除；网络失败或 token 已失效时不阻塞退出
  } finally {
    setAuthToken(null);
    writeStoredString(ACTIVE_WORK_KEY, null);
  }
}

export async function fetchMe() {
  return apiFetch<{ user: AuthUser }>("/api/auth/me");
}

export async function updateProfile(input: {
  name?: string;
  bio?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
}) {
  return apiFetch<{ user: AuthUser }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function requestPasswordReset(login: string) {
  return apiFetch<{ ok: true; devResetUrl?: string }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ login }),
    },
  );
}

export async function resetPassword(input: { token: string; password: string }) {
  return apiFetch<{ ok: true }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function requestEmailChange(input: {
  newEmail: string;
  currentPassword: string;
}) {
  return apiFetch<{
    ok: true;
    message: string;
    devConfirmUrl?: string;
  }>("/api/auth/change-email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function confirmEmailChange(token: string) {
  return apiFetch<{ user: AuthUser; token: string }>(
    "/api/auth/confirm-email",
    {
      method: "POST",
      body: JSON.stringify({ token }),
    },
  );
}
