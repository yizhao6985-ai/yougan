import { Client } from "@langchain/langgraph-sdk";

import { LANGGRAPH_API_URL } from "@/lib/env";

export function getLangGraphClient(defaultHeaders?: Record<string, string>) {
  return new Client({
    apiUrl: LANGGRAPH_API_URL,
    ...(defaultHeaders ? { defaultHeaders } : {}),
  });
}
