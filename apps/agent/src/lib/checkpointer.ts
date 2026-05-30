/**
 * LangGraph Postgres checkpoint（会话 thread 持久化，独立于 API 业务库）。
 */
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import { env } from "../env.js";

export const checkpointer = PostgresSaver.fromConnString(env.postgresUri);

await checkpointer.setup();
