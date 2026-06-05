/**
 * Yougan 主 Graph 入口（langgraph.json 指向此文件）。
 *
 * ```text
 * START
 *   ├─ 空 thread → verifyTurn（开屏 7 条建议）→ END
 *   └─ 有消息 → orchestrateTurn → dispatchTurnQueue → [profile|production|ask]
 *         → advanceTurnQueue → … → verifyTurn（4 条建议）→ commitTurn → END
 * ```
 *
 * 外层三分：planner（编排）→ executor（子图）→ verifier（建议 + 提交）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as routeAfterTurnQueue from "./nodes/edges/route-after-turn-queue.js";
import * as routeAfterVerify from "./nodes/edges/route-after-verify.js";
import * as routeByEntry from "./nodes/edges/route-by-entry.js";
import * as routeByTurnQueue from "./nodes/edges/route-by-turn-queue.js";
import { advanceTurnQueueNode } from "./nodes/executor/advance.js";
import { dispatchTurnQueueNode } from "./nodes/executor/dispatch.js";
import { askGraph } from "./nodes/executor/subgraphs/ask/graph.js";
import { productionGraph } from "./nodes/executor/subgraphs/production/graph.js";
import { profileGraph } from "./nodes/executor/subgraphs/profile/graph.js";
import { orchestrateTurnNode } from "./nodes/planner/index.js";
import { commitTurnNode } from "./nodes/verifier/commit.js";
import { verifyTurnNode } from "./nodes/verifier/index.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("orchestrateTurn", orchestrateTurnNode)
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("verifyTurn", verifyTurnNode)
  .addNode("commitTurn", commitTurnNode)
  .addNode("profileGraph", profileGraph)
  .addNode("productionGraph", productionGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(START, routeByEntry.routeByEntry, routeByEntry.paths)
  .addEdge("orchestrateTurn", "dispatchTurnQueue")
  .addConditionalEdges(
    "dispatchTurnQueue",
    routeByTurnQueue.routeByTurnQueue,
    routeByTurnQueue.paths,
  )
  .addEdge("profileGraph", "advanceTurnQueue")
  .addEdge("productionGraph", "advanceTurnQueue")
  .addEdge("askGraph", "advanceTurnQueue")
  .addConditionalEdges(
    "advanceTurnQueue",
    routeAfterTurnQueue.routeAfterTurnQueue,
    routeAfterTurnQueue.paths,
  )
  .addConditionalEdges(
    "verifyTurn",
    routeAfterVerify.routeAfterVerify,
    routeAfterVerify.paths,
  )
  .addEdge("commitTurn", END);

export const graph = workflow.compile({ checkpointer });
