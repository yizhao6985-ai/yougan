/**
 * LangGraph Postgres checkpoint（会话 thread 持久化，与 API 共用实例、独立 database）。
 */
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import { env } from "./env.js";

export const checkpointer = PostgresSaver.fromConnString(env.postgresUri);

await checkpointer.setup();
