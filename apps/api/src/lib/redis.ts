import Redis, { Redis as RedisClient } from "ioredis";

import { env } from "../env.js";

let client: RedisClient | null = null;
let connectPromise: Promise<void> | null = null;

export function isCacheEnabled() {
  return Boolean(env.redis.url);
}

export function getRedisClient() {
  return client;
}

export async function connectRedis() {
  if (!env.redis.url) return;
  if (client) return;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const redis = new RedisClient(env.redis.url!, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on("error", (error) => {
      console.error("[redis] connection error:", error.message);
    });

    await redis.connect();
    client = redis;
    console.log("[redis] connected");
  })();

  try {
    await connectPromise;
  } catch (error) {
    connectPromise = null;
    client = null;
    console.error("[redis] failed to connect, cache disabled:", error);
  }
}

export async function disconnectRedis() {
  if (!client) return;
  await client.quit();
  client = null;
  connectPromise = null;
}

export async function pingRedis() {
  if (!client) return false;
  const result = await client.ping();
  return result === "PONG";
}
