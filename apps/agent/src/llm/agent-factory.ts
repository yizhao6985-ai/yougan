/**
 * 按温度缓存各模式 ReAct Agent，避免每条消息重复编译。
 */
import type { Runnable } from "@langchain/core/runnables";

import { env } from "../env.js";
import { createInspirationAgent } from "../agents/inspiration/agent.js";
import { createOutlineAgent } from "../agents/outline/agent.js";
import { createCreationAgent } from "../agents/creation/agent.js";

export function normalizeModelTemperature(temperature: number | undefined): number {
  if (temperature == null || Number.isNaN(temperature)) {
    return env.minimaxTemperature;
  }
  return Math.min(1, Math.max(0.1, Math.round(temperature * 10) / 10));
}

function cacheKey(temperature: number | undefined): number {
  return normalizeModelTemperature(temperature);
}

const inspirationAgentCache = new Map<number, Runnable>();
const outlineAgentCache = new Map<number, Runnable>();
const creationAgentCache = new Map<number, Runnable>();

export function getInspirationAgent(temperature?: number) {
  const key = cacheKey(temperature);
  const cached = inspirationAgentCache.get(key);
  if (cached) return cached;

  const agent = createInspirationAgent(key);
  inspirationAgentCache.set(key, agent);
  return agent;
}

export function getOutlineAgent(temperature?: number) {
  const key = cacheKey(temperature);
  const cached = outlineAgentCache.get(key);
  if (cached) return cached;

  const agent = createOutlineAgent(key);
  outlineAgentCache.set(key, agent);
  return agent;
}

export function getCreationAgent(temperature?: number) {
  const key = cacheKey(temperature);
  const cached = creationAgentCache.get(key);
  if (cached) return cached;

  const agent = createCreationAgent(key);
  creationAgentCache.set(key, agent);
  return agent;
}
