import type { Thread } from "@langchain/langgraph-sdk";
import { truncateAtMaxLength } from "@yougan/domain";

import { messageContentToText } from "@/lib/message-content";

import { YOUGAN_ASSISTANT_ID } from "@/lib/yougan-chat-api";
import { getLangGraphClient } from "@/lib/langgraph-client";

const PAGE_SIZE = 40;

const METADATA_APP = "app";
const METADATA_TITLE = "title";

export type YouganThreadItem = {
  id: string;
  title: string;
  updatedAt: string;
};

function formatThreadTitle(thread: Thread): string {
  const metadataTitle = thread.metadata?.[METADATA_TITLE];
  if (typeof metadataTitle === "string" && metadataTitle.trim()) {
    return metadataTitle.trim();
  }

  const values = thread.values as { messages?: Array<{ type?: string; content?: unknown }> };
  const firstHuman = values?.messages?.find((message) => message.type === "human");
  if (firstHuman) {
    const text = messageContentToText(firstHuman.content).trim();
    if (text) return truncateAtMaxLength(text);
  }

  const updatedAt = new Date(thread.updated_at);
  if (!Number.isNaN(updatedAt.getTime())) {
    return updatedAt.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "新对话";
}

export async function listYouganThreads(offset = 0): Promise<{
  threads: YouganThreadItem[];
  nextOffset?: number;
}> {
  const client = getLangGraphClient();
  const threads = await client.threads.search({
    limit: PAGE_SIZE + 1,
    offset,
    sortBy: "updated_at",
    sortOrder: "desc",
  });

  const hasMore = threads.length > PAGE_SIZE;
  const page = hasMore ? threads.slice(0, PAGE_SIZE) : threads;

  return {
    threads: page.map((thread) => ({
      id: thread.thread_id,
      title: formatThreadTitle(thread),
      updatedAt: thread.updated_at,
    })),
    nextOffset: hasMore ? offset + PAGE_SIZE : undefined,
  };
}

export async function createYouganThread() {
  const client = getLangGraphClient();
  return client.threads.create({
    metadata: { [METADATA_APP]: YOUGAN_ASSISTANT_ID },
  });
}

export async function deleteYouganThread(threadId: string) {
  const client = getLangGraphClient();
  await client.threads.delete(threadId);
}
