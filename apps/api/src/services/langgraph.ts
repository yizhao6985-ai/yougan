import { Client } from "@langchain/langgraph-sdk";

import { env } from "../env.js";

let client: Client | null = null;

function getLangGraphClient() {
  client ??= new Client({ apiUrl: env.agentUrl });
  return client;
}

export async function getLangGraphThreadValues(threadId: string) {
  const state = await getLangGraphClient().threads.getState(threadId);
  return state.values ?? null;
}

export async function getLangGraphThreadCheckpointId(threadId: string) {
  const state = await getLangGraphClient().threads.getState(threadId);
  const checkpoint = state.checkpoint as { checkpoint_id?: string } | undefined;
  return checkpoint?.checkpoint_id ?? null;
}

export async function patchThreadValues(
  threadId: string,
  values: Record<string, unknown>,
) {
  await getLangGraphClient().threads.updateState(threadId, { values });
}
