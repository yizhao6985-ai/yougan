import { Client } from "@langchain/langgraph-sdk";
import type {
  WorkPreview,
  WorkProduction,
  WorkProfile,
  WorkReference,
  WorkRevision,
} from "@yougan/domain";

import { env } from "../env.js";
import { prisma } from "../db.js";
import {
  parseProduction,
  parseProfileJson,
  parseReferencesJson,
  parseRevisionJson,
  parseWorkPreview,
} from "./versions.js";

let client: Client | null = null;

function getLangGraphClient() {
  client ??= new Client({ apiUrl: env.agentUrl });
  return client;
}

export type MaterializedAgentFields = {
  profile?: WorkProfile;
  references?: WorkReference[];
  preview?: WorkPreview | null;
  revision?: WorkRevision;
  production?: WorkProduction;
};

function buildThreadValuesPatch(
  fields: MaterializedAgentFields,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  if (fields.profile !== undefined) values.profile = fields.profile;
  if (fields.references !== undefined) values.references = fields.references;
  if (fields.preview !== undefined) values.preview = fields.preview;
  if (fields.revision !== undefined) values.revision = fields.revision;
  if (fields.production !== undefined) values.production = fields.production;
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
      ...(options?.conversationId ? { id: options.conversationId } : {}),
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
  references?: unknown;
  preview?: unknown | null;
  revision?: unknown;
  production?: unknown;
}): MaterializedAgentFields {
  const fields: MaterializedAgentFields = {};
  if (data.profile !== undefined) {
    fields.profile = parseProfileJson(data.profile);
  }
  if (data.references !== undefined) {
    fields.references = parseReferencesJson(data.references);
  }
  if (data.preview !== undefined) {
    fields.preview =
      data.preview === null ? null : parseWorkPreview(data.preview);
  }
  if (data.revision !== undefined) {
    fields.revision = parseRevisionJson(data.revision);
  }
  if (data.production !== undefined) {
    fields.production = parseProduction(data.production);
  }
  return fields;
}

export function hasMaterializedAgentFields(
  fields: MaterializedAgentFields,
): boolean {
  return Object.keys(buildThreadValuesPatch(fields)).length > 0;
}
