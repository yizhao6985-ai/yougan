import crypto from "node:crypto";

import { cacheDel, cacheGetJson, cacheSetJson } from "../lib/cache.js";
import { getRedisClient, isCacheEnabled } from "../lib/redis.js";

const OTP_TTL_SECONDS = 5 * 60;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

type OtpRecord = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

const memoryOtpStore = new Map<string, OtpRecord>();
const memoryCooldownStore = new Map<string, number>();

function otpKey(phone: string) {
  return `auth:sms:otp:${phone}`;
}

function cooldownKey(phone: string) {
  return `auth:sms:cooldown:${phone}`;
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function getSmsCooldownRemaining(phone: string): Promise<number> {
  const key = cooldownKey(phone);

  if (isCacheEnabled()) {
    const redis = getRedisClient();
    if (!redis) return 0;
    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  const expiresAt = memoryCooldownStore.get(key);
  if (!expiresAt) return 0;
  const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
  if (remaining <= 0) {
    memoryCooldownStore.delete(key);
    return 0;
  }
  return remaining;
}

export async function storeSmsCode(phone: string, code: string) {
  const record: OtpRecord = {
    codeHash: hashCode(code),
    expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    attempts: 0,
  };

  if (isCacheEnabled()) {
    await cacheSetJson(otpKey(phone), record, OTP_TTL_SECONDS);
    const redis = getRedisClient();
    if (redis) {
      await redis.set(cooldownKey(phone), "1", "EX", OTP_COOLDOWN_SECONDS);
    }
    return;
  }

  memoryOtpStore.set(phone, record);
  memoryCooldownStore.set(
    cooldownKey(phone),
    Date.now() + OTP_COOLDOWN_SECONDS * 1000,
  );
}

export async function verifySmsCode(phone: string, code: string) {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("INVALID_SMS_CODE");
  }

  let record: OtpRecord | null = null;

  if (isCacheEnabled()) {
    record = await cacheGetJson<OtpRecord>(otpKey(phone));
  } else {
    record = memoryOtpStore.get(phone) ?? null;
  }

  if (!record || record.expiresAt <= Date.now()) {
    throw new Error("SMS_CODE_EXPIRED");
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("SMS_CODE_LOCKED");
  }

  const matches = record.codeHash === hashCode(trimmed);
  record.attempts += 1;

  if (isCacheEnabled()) {
    const remainingTtl = Math.max(
      1,
      Math.ceil((record.expiresAt - Date.now()) / 1000),
    );
    await cacheSetJson(otpKey(phone), record, remainingTtl);
  } else {
    memoryOtpStore.set(phone, record);
  }

  if (!matches) {
    throw new Error("INVALID_SMS_CODE");
  }

  if (isCacheEnabled()) {
    await cacheDel(otpKey(phone));
  } else {
    memoryOtpStore.delete(phone);
  }
}
