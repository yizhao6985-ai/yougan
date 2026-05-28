import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../env.js";
import {
  cacheGetJson,
  cacheKeys,
  cacheSetJson,
  cacheTtl,
  invalidateSessionCaches,
  invalidateUserCache,
} from "../lib/cache.js";
import { sendEmailChangeEmail, sendPasswordResetEmail } from "../lib/mail.js";
import { prisma } from "../db.js";
import { ensureUserSubscription } from "./subscription.js";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
}

function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "30d",
  });
}

export function verifyToken(token: string): { sub: string; email: string } {
  return jwt.verify(token, env.jwtSecret) as { sub: string; email: string };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new Error("EMAIL_EXISTS");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name ?? null,
    },
  });
  await ensureUserSubscription(user.id);
  return toAuthUser(user);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("INVALID_CREDENTIALS");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");
  return toAuthUser(user);
}

export async function getUserById(id: string) {
  const cacheKey = cacheKeys.user(id);
  const cached = await cacheGetJson<ReturnType<typeof toAuthUser>>(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  const result = toAuthUser(user);
  await cacheSetJson(cacheKey, result, cacheTtl.userTtl);
  return result;
}

export async function updateUserProfile(
  userId: string,
  input: {
    name?: string;
    bio?: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const data: {
    name?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    passwordHash?: string;
  } = {};

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    data.name = trimmed || null;
  }

  if (input.bio !== undefined) {
    const trimmed = input.bio.trim();
    data.bio = trimmed || null;
  }

  if (input.avatarUrl !== undefined) {
    data.avatarUrl = input.avatarUrl;
  }

  if (input.coverUrl !== undefined) {
    data.coverUrl = input.coverUrl;
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new Error("CURRENT_PASSWORD_REQUIRED");
    }
    const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!ok) throw new Error("INVALID_CURRENT_PASSWORD");
    if (input.newPassword.length < 6) {
      throw new Error("PASSWORD_TOO_SHORT");
    }
    data.passwordHash = await bcrypt.hash(input.newPassword, 10);
  }

  if (!Object.keys(data).length) {
    return getUserById(userId);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });

  await invalidateUserCache(userId);

  return toAuthUser(updated);
}

export async function logoutUser(userId: string) {
  await invalidateSessionCaches(userId);
}

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function requestPasswordReset(
  email: string,
): Promise<{ devResetUrl?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  });
  if (!user) {
    if (!env.isProduction) {
      console.info(
        `[auth] Password reset requested, but no account found for ${normalizedEmail}`,
      );
    }
    return {};
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const resetUrl = new URL("/reset-password", env.webAppUrl);
  resetUrl.searchParams.set("token", rawToken);
  const resetUrlString = resetUrl.toString();

  await sendPasswordResetEmail(user.email, resetUrlString);

  if (!env.mail.smtpConfigured && !env.isProduction) {
    return { devResetUrl: resetUrlString };
  }

  return {};
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
) {
  if (newPassword.length < 6) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  const tokenHash = hashToken(rawToken.trim());
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new Error("INVALID_RESET_TOKEN");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: record.userId,
        id: { not: record.id },
      },
    }),
  ]);

  await invalidateUserCache(record.userId);
  await invalidateSessionCaches(record.userId);
}

export async function requestEmailChange(
  userId: string,
  newEmail: string,
  currentPassword: string,
): Promise<{ devConfirmUrl?: string }> {
  const normalizedEmail = newEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (normalizedEmail === user.email.toLowerCase()) {
    throw new Error("EMAIL_UNCHANGED");
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new Error("INVALID_CURRENT_PASSWORD");

  const existing = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  });
  if (existing) throw new Error("EMAIL_EXISTS");

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

  await prisma.$transaction([
    prisma.emailChangeToken.deleteMany({ where: { userId } }),
    prisma.emailChangeToken.create({
      data: {
        userId,
        newEmail: normalizedEmail,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const confirmUrl = new URL("/confirm-email", env.webAppUrl);
  confirmUrl.searchParams.set("token", rawToken);
  const confirmUrlString = confirmUrl.toString();

  await sendEmailChangeEmail(normalizedEmail, confirmUrlString);

  if (!env.mail.smtpConfigured && !env.isProduction) {
    return { devConfirmUrl: confirmUrlString };
  }

  return {};
}

export async function confirmEmailChange(rawToken: string) {
  const tokenHash = hashToken(rawToken.trim());
  const record = await prisma.emailChangeToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new Error("INVALID_EMAIL_CHANGE_TOKEN");
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      email: { equals: record.newEmail, mode: "insensitive" },
      id: { not: record.userId },
    },
  });
  if (duplicate) throw new Error("EMAIL_EXISTS");

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: record.userId },
      data: { email: record.newEmail },
    });
    await tx.emailChangeToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    await tx.emailChangeToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    });
    return user;
  });

  await invalidateUserCache(record.userId);
  await invalidateSessionCaches(record.userId);

  const authUser: AuthUser = {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    bio: updated.bio,
    avatarUrl: updated.avatarUrl,
    coverUrl: updated.coverUrl,
  };

  return {
    user: toAuthUser(updated),
    token: signToken(authUser),
  };
}
