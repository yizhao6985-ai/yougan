# Agent 回合队列与节点分工

主 Graph（`apps/agent/src/graph.ts`）通过**回合队列**编排用户消息：仅路由到四条**对话子图**（有可见回复与工具）。作品物化状态（profile / brief / outline / draft）的**直改**由 Web 侧栏 `PATCH /api/works/:id` 写入数据库，并由 API 同步到各对话的 LangGraph thread checkpoint（不经 Agent run）。

## 状态变更的两条路径

| 来源 | 路径 | 是否有对话回复 |
|------|------|----------------|
| UI 侧栏 U/D | `PATCH Work` → Prisma 物化列 → `syncMaterializedStateToAgentThreads` | 否 |
| 聊天 C/U/D | `resolveTurnQueue` → 灵感 / 大纲 / 创作 / 提问子图 | 是 |

权威作品状态在 `Work` 表；多对话共享 brief/outline 等。仅改 DB 时各 `threadId` checkpoint 会陈旧，直到下次 run 的 `injectWorkContext` 或 **API 线程同步**。

## 主图拓扑

```text
START
  ├─ 空 thread → verifyTurn（开屏选题建议 7 条）→ END
  └─ 有消息 → orchestrateTurn（planTurnQueue → turnQueue）
         → dispatchTurnQueue（设置 activeTurnKind）
         → 路由到对话子图
         → advanceTurnQueue（出队 → completedTurnKinds）
         → 队列非空？回到 dispatchTurnQueue
         → 队列已空？verifyTurn（对话流建议 4 条）→ commitTurn → END
```

## 两层三分（模块划分）

### 外层 turn

| 角色 | 目录 | 职责 |
|------|------|------|
| 计划者 | `nodes/planner/` | 解析用户消息 → `turnQueue[]` |
| 执行者 | `nodes/executor/` | `dispatch` / `advance` + 子图 `profile` / `production` / `ask` |
| 验收者 | `nodes/verifier/` | `verifyTurn` 生成 `nextStepSuggestions`（开屏 7 / 对话流 4）与 `suggestedConversationTitle`（首条用户消息）→ `commitTurn` |

路由：`nodes/edges/`

### 内层 production

| 角色 | 目录 | 职责 |
|------|------|------|
| 计划者 | `executor/subgraphs/production/planner/` | 准备回合、解析规格、制定制作计划 |
| 创作者 | `.../creator/` | llmCall / designLlmCall ⇄ tools |
| 验收者 | `.../inspector/` | 单任务质检 `inspectProduction` |

## 队列项类型（TurnQueueKind）

定义于 `packages/domain/src/models/chat/turn-queue.ts`（排序工具见 `utils/turn-queue.ts`）：

| kind | 主图节点 | 行为 |
|------|----------|------|
| `profile` | `profileGraph` | 作品方案对话 |
| `production` | `productionGraph` | 制作子图（内层三分） |
| `ask` | `askGraph` | 提问答疑 |

排序：`sortTurnQueue` → `profile` → `production` → `ask`。

## 运行时 state 字段

| 字段 | 说明 |
|------|------|
| `turnQueue` | 本轮待执行队列（队首为下一项） |
| `activeTurnKind` | 当前正在执行的队列项 |
| `completedTurnKinds` | 本轮已完成项（回合末建议等） |

## 路由

- `nodes/edges/route-by-turn-queue.ts`：`dispatchTurnQueue` 之后按 `activeTurnKind` 路由
- `nodes/edges/route-after-turn-queue.ts`：`advanceTurnQueue` 之后继续调度或 `verifyTurn`
- `nodes/edges/route-after-verify.ts`：开屏结束或进入 `commitTurn`

## API 线程同步

`apps/api/src/services/agent-thread-sync.ts`：在 `updateWork` 更新 profile/brief/outline/draft 后，对作品下所有（或指定 `?conversationId=`）`threadId` 调用 LangGraph `threads.updateState`。

LangGraph stream 结束后（`agent-proxy`）：`verifyTurn` 写入的 `suggestedConversationTitle` 经 `conversation-auto-title.ts` 落库（对话标题仍为「对话 N」且 thread 内仅 1 条 human）。

## 相关代码

- `packages/domain/src/models/chat/turn-queue.ts`
- `packages/domain/src/utils/turn-queue.ts`
- `apps/agent/src/graph.ts`
- `apps/agent/src/nodes/`（`planner` / `executor` / `verifier` / `edges`）
- `apps/api/src/services/agent-thread-sync.ts`
