import { Client } from "@langchain/langgraph-sdk";
import type { WorkBrief, WorkDraft, WorkOutline, WorkProfile } from "@yougan/domain";

import { env } from "../env.js";
import { prisma } from "../db.js";
import {
  parseBrief,
  parseDraft,
  parseOutline,
  parseProfile,
} from "./revisions.js";

let client: Client | null = null;

function getLangGraphClient() {
  client ??= new Client({ apiUrl: env.agentUrl });
  return client;
}

export type MaterializedAgentFields = {
  profile?: WorkProfile;
  brief?: WorkBrief;
  outline?: WorkOutline;
  draft?: WorkDraft | null;
};

function buildThreadValuesPatch(
  fields: MaterializedAgentFields,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  if (fields.profile !== undefined) values.profile = fields.profile;
  if (fields.brief !== undefined) values.brief = fields.brief;
  if (fields.outline !== undefined) values.outline = fields.outline;
  if (fields.draft !== undefined) values.draft = fields.draft;
  return values;
}

async function patchThreadValues(
  threadId: string,
  values: Record<string, unknown>,
): Promise<void> {
  const lg = getLangGraphClient();
  await lg.threads.updateState(threadId, { values });
}

/**
 * 将作品物化列同步到 LangGraph checkpoint（UI 直改、不触发 run）。
 * 默认同步该作品下所有有 threadId 的对话；可指定 conversationId 仅同步一条。
 */
export async function syncMaterializedStateToAgentThreads(
  workId: string,
  fields: MaterializedAgentFields,
  options?: { conversationId?: string },
): Promise<void> {
  const values = buildThreadValuesPatch(fields);
  if (!Object.keys(values).length) return;

  const conversations = await prisma.workConversation.findMany({
    where: {
      workId,
      threadId: { not: null },
      ...(options?.conversationId
        ? { id: options.conversationId }
        : {}),
    },
    select: { threadId: true },
  });

  await Promise.all(
    conversations.map(async (row) => {
      if (!row.threadId) return;
      try {
        await patchThreadValues(row.threadId, values);
      } catch (error) {
        console.error(
          `[agent-thread-sync] failed thread=${row.threadId} work=${workId}`,
          error,
        );
      }
    }),
  );
}

export function materializedFieldsFromWorkUpdate(data: {
  profile?: unknown;
  brief?: unknown;
  outline?: unknown;
  draft?: unknown | null;
}): MaterializedAgentFields {
  const fields: MaterializedAgentFields = {};
  if (data.profile !== undefined) {
    fields.profile = parseProfile(data.profile);
  }
  if (data.brief !== undefined) {
    fields.brief = parseBrief(data.brief);
  }
  if (data.outline !== undefined) {
    fields.outline = parseOutline(data.outline);
  }
  if (data.draft !== undefined) {
    fields.draft = data.draft === null ? null : parseDraft(data.draft);
  }
  return fields;
}

export function hasMaterializedAgentFields(
  fields: MaterializedAgentFields,
): boolean {
  return Object.keys(buildThreadValuesPatch(fields)).length > 0;
}
