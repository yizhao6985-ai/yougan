import { getLangGraphClient } from "@/lib/langgraph-client";

export const YOUGAN_ASSISTANT_ID = "yougan";

export async function getYouganThreadState(
  threadId: string,
  defaultHeaders?: Record<string, string>,
) {
  const client = getLangGraphClient(defaultHeaders);
  return client.threads.getState(threadId);
}
