import { env } from "../env.js";
import { cacheKeys } from "./cache-keys.js";
import { getRedisClient, isCacheEnabled } from "./redis.js";

export { cacheKeys };
export const cacheTtl = env.cache;

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  if (!isCacheEnabled()) return null;

  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("[cache] get failed:", key, error);
    return null;
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
) {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.error("[cache] set failed:", key, error);
  }
}

export async function cacheDel(key: string) {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("[cache] del failed:", key, error);
  }
}

export async function cacheDelByPattern(pattern: string) {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.error("[cache] del pattern failed:", pattern, error);
  }
}

export async function cacheSetNx(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<boolean> {
  if (!isCacheEnabled()) return true;

  const redis = getRedisClient();
  if (!redis) return true;

  try {
    const result = await redis.set(key, value, "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch (error) {
    console.error("[cache] setnx failed:", key, error);
    return true;
  }
}

export async function invalidatePublicationCaches(slug?: string | null) {
  if (slug) {
    await cacheDel(cacheKeys.publicationSlug(slug));
  }
  await cacheDelByPattern(cacheKeys.publicationFeedPattern);
}

export async function invalidateUserCache(userId: string) {
  await cacheDel(cacheKeys.user(userId));
}

export async function invalidateIntegrationsCache(userId: string) {
  await cacheDel(cacheKeys.integrations(userId));
}

export async function invalidateSessionCaches(userId: string) {
  await Promise.all([
    invalidateUserCache(userId),
    invalidateIntegrationsCache(userId),
  ]);
}
