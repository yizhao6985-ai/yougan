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
  ├─ 空 thread → updateNextStepSuggestions → END
  └─ 有消息 → resolveTurnQueue（planTurnQueue → 写入 turnQueue）
         → dispatchTurnQueue（设置 activeTurnKind）
         → 路由到对话子图
         → advanceTurnQueue（出队 → completedTurnKinds）
         → 队列非空？回到 dispatchTurnQueue
         → 队列已空？updateNextStepSuggestions → END
```

## 模块划分

| 目录 / 节点 | 职责 |
|-------------|------|
| `nodes/resolve-turn-queue/` | 解析用户消息 → `turnQueue[]`；首条用户消息且占位标题时另输出 `suggestedConversationTitle` |
| `nodes/next-step-suggestions/` | 开屏选题（`openingNextStepSuggestions`）+ 回合末下一步（`turnNextStepSuggestions`） |
| `nodes/turn-queue/` | **流程**：`dispatchTurnQueue`、`advanceTurnQueue` |
| `nodes/inspiration\|outline\|creation\|ask/` | **业务**：对话子图 + 工具改状态 |
| `lib/outline/` | 大纲 bootstrap / 全量修订（子图与 prepare-turn 复用） |

## 队列项类型（TurnQueueKind）

定义于 `packages/domain/src/turn-queue.ts`：

| kind | 主图节点 | 行为 |
|------|----------|------|
| `outline` | `outlineGraph` | 大纲对话；`prepare-turn` 可同步参考图、bootstrap 空大纲 |
| `inspiration` | `inspirationGraph` | 灵感对话；改 brief 等 |
| `creation` | `creationGraph` | 创作子图 |
| `ask` | `askGraph` | 提问子图 |

排序：`sortTurnQueue` → `outline` → `inspiration` → `creation` → `ask`。

## 运行时 state 字段

| 字段 | 说明 |
|------|------|
| `turnQueue` | 本轮待执行队列（队首为下一项） |
| `activeTurnKind` | 当前正在执行的队列项 |
| `completedTurnKinds` | 本轮已完成项（回合末建议等） |

## 路由

- `conditional-edges/route-by-turn-queue.ts`：`dispatchTurnQueue` 之后按 `activeTurnKind` 路由
- `conditional-edges/route-after-turn-queue.ts`：`advanceTurnQueue` 之后继续调度或结束

## API 线程同步

`apps/api/src/services/agent-thread-sync.ts`：在 `updateWork` 更新 profile/brief/outline/draft 后，对作品下所有（或指定 `?conversationId=`）`threadId` 调用 LangGraph `threads.updateState`。

LangGraph stream 结束后（`agent-proxy`）：`applyAgentRunRevision` 之后，`conversation-auto-title.ts` 在对话标题仍为「对话 N」且 thread 内仅 1 条 human 时，将 `suggestedConversationTitle` 写入 `WorkConversation.title`。

## 相关代码

- `packages/domain/src/turn-queue.ts`
- `apps/agent/src/graph.ts`
- `apps/agent/src/nodes/turn-queue/`
- `apps/api/src/services/agent-thread-sync.ts`
