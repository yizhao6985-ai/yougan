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
