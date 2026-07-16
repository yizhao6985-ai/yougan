# Agent 回合队列与节点分工

主 Graph（`apps/agent/src/graph.ts`）通过**回合队列** workflow 用户消息：路由到四条**对话子图**（有可见回复与工具）。作品物化状态（`profile` / `references` / `productionPlan` / `preview`）的**直改**由 Web 侧栏 `PATCH /api/works/:id` 写入数据库，并由 API 同步到各对话的 LangGraph thread checkpoint（不经 Agent run）。

## 状态变更的两条路径

| 来源 | 路径 | 是否有对话回复 |
|------|------|----------------|
| UI 侧栏 U/D | `PATCH Work` → Prisma 物化列 → `syncMaterializedStateToAgentThreads` | 否 |
| 聊天 C/U/D | `planTurnQueue` → `turn.queue` → 子图 | 是 |

权威作品状态在 `Work` 表；多对话共享 `profile` / `references` / `preview` 等。仅改 DB 时各 `threadId` checkpoint 会陈旧，直到下次 run 的 `injectWorkContext` 或 **API 线程同步**。

## 主图拓扑

```text
START
  ├─ 空 thread → generateSuggestions（开屏 7 条建议）→ END
  └─ 有消息 → planTurnQueue（解析 turn.queue + fork turn.staging）
         → dispatchTurnQueue（设置 turn.activeKind）
         → 路由到对话子图（reference / profile / production / ask）
         → advanceTurnQueue（出队 → turn.completedKinds）
         → 队列非空？回到 dispatchTurnQueue
         → 队列已空？commitTurn →（需系统收尾）postCommit → END
```

取消回合：`turn.cancelled` 时 `commitTurn` 执行 rollback；`postCommit` 会跳过。

## 两层三分（模块划分）

### 外层 turn

| 角色 | 目录 | 节点 | 职责 |
|------|------|------|------|
| 计划者 | `nodes/plan-turn-queue/` | `planTurnQueue` | LLM 解析用户意图 → `turn.queue[]`；有附件时确定性前置 `reference` |
| 执行者 | `nodes/dispatch-turn-queue/`、`advance-turn-queue/` + 子图 | `dispatchTurnQueue` / `advanceTurnQueue` | 按队列路由并执行子图 |
| 系统收尾 | `post-commit/` | `commitTurn` → `postCommit` | `generatedConversationTitle`（建议由 `suggestions` 子图写入 `nextStepSuggestions`） |

条件边：`state-graph/conditional-edges/`（`at-graph-start`、`after-dispatch-turn-queue`、`after-advance-turn-queue`）

### 内层子图

**reference**（`subgraphs/reference/`）：`preprocessReferences` ⇄ `runPreprocessTools` → `mutateReferences` ⇄ `runMutateTools` → `summarizeReferences`。新附件走预处理分析入库；无新附件时走删改参考。

**profile**（`subgraphs/profile/`）：`mutateProfile` ⇄ `runProfileTools`（按步骤原子工具改方案，经 `applyProfilePatch` 写入 staging）。

**production**（`subgraphs/production/`，详见 `README.md`）：`planProduction` → `dispatchTask` → `executeWriting` /（`executeDesign` → `renderDesignImage`）→ `acceptTask` → `routeProduction` →（`dispatchTask`、`assemblePreview`、计划为空或验收 3 次失败时直达 `summarizeProduction`）→ `summarizeProduction`。design 任务必经 executeDesign，dispatch 不直达 renderDesignImage。任务在 `Work.production.pending_tasks`（`in_progress` 为当前任务）；验收未通过带 `feedback` 自动重产，达上限标 `failed`。

**ask**（`subgraphs/ask/`）：`answerQuestion` ⇄ `runAskTools`（纯答疑）。

## 队列项类型（TurnQueueKind）

定义于 `packages/domain/src/models/agent/turn.ts`；排序见 `plan-turn-queue/helpers/sort-turn-queue.ts`：

| kind | 主图节点 | 行为 |
|------|----------|------|
| `reference` | `referenceGraph` | 分析新附件 / 删改参考素材 |
| `profile` | `profileGraph` | 作品方案对话（按步骤改 `direction` / `style` / `setting` / `requirements` / `bounds`） |
| `production` | `productionGraph` | 制作计划 + 出稿 + 质检 |
| `ask` | `askGraph` | 提问答疑 |

排序：`reference` → `profile` → `production` → `ask`。

### reference 入队规则（`plan-turn-queue`）

- 无附件：仅当模型判定用户要删/改参考素材时入队 `reference`
- 有附件且队列已含 `reference`：不重复前置
- 有附件且纯 `ask`：不前置（纯讨论不入库）
- 有附件且非纯 `ask`：确定性前置 `reference`，供 `preprocessReferences` 预处理新附件

### production 入队规则（`plan-turn-queue`）

- **意图判定**：主要由 `planTurnQueue` LLM 根据用户最新消息输出 `kinds`；对「开始制作 / 开写 / 出稿」等明确口令，另有确定性补入 `production`
- **状态门**：`filterProductionQueue` 在必填方案未齐（创作定位 + 体裁，`isProfileSetupReady`）时剔除 `production`；风格/背景等可选步未填不拦截
- **确认环节**：`production` 入队后仍经 `confirmProductionTurn` interrupt，用户最终确认是否开写
- 讨论方案、描述创作方向、补充约束、聊选题 → `profile`（即使 `has_preview=true`）
- 不确定是否该出稿 → 只输出 `profile`，禁止因已有成稿而默认 `production`

## 运行时 state 字段

### `turn`（单轮执行，`TurnRuntime`）

| 字段 | 说明 |
|------|------|
| `turn.queue` | 本轮待执行队列（队首为下一项） |
| `turn.activeKind` | 当前正在执行的队列项 |
| `turn.completedKinds` | 本轮已完成项 |
| `turn.staging` | 单轮工作区（子图写入；`commitTurn` 提交到顶层） |
| `turn.committed` | 本回合是否已提交 |
| `turn.cancelled` | 用户是否取消本回合 |
| `turn.interruptedMessageIds` | 被打断的消息 id |

### state 顶层（作品物化 + 验收产物）

| 字段 | 说明 |
|------|------|
| `profile` | 作品创作方案 |
| `references` | 参考素材 |
| `production` | 制作聚合（`pending_tasks`、`summary`、`preview`；不对用户主展示计划细节） |
| `preview` | 作品预览（标题、正文等） |
| `nextStepSuggestions` | 开屏或回合末生成的下一步建议（不入库） |
| `generatedConversationTitle` | 首条用户消息后的对话标题建议 |

读取规则：作品字段 **staging 优先**（`state-io/get.ts`）；调度读 `turn` 顶层。

## 路由

- `conditional-edges/at-graph-start.ts`：START 空 thread → `generateSuggestions`，有消息 → `planTurnQueue`
- `conditional-edges/after-dispatch-turn-queue.ts`：`dispatchTurnQueue` 之后按 `turn.activeKind` 路由
- `conditional-edges/after-advance-turn-queue.ts`：`advanceTurnQueue` 之后继续 `dispatchTurnQueue` 或 `commitTurn`

## API 线程同步

`apps/api/src/services/agent-thread-sync.ts`：在 `updateWork` 更新 `profile` / `references` / `preview` 后，对作品下所有（或指定 `?conversationId=`）`threadId` 调用 LangGraph `threads.updateState`。

LangGraph stream 结束后（`agent-proxy`）：`postCommit` 写入的 `generatedConversationTitle` 经 `conversation-auto-title.ts` 落库（对话标题仍为「对话 N」且 thread 内仅 1 条 human）。

## 相关代码

- `packages/domain/src/models/agent/turn.ts`
- `packages/domain/src/models/agent/staging.ts`
- `apps/agent/src/state-graph/nodes/plan-turn-queue/helpers/sort-turn-queue.ts`
- `apps/agent/src/graph.ts`
- `apps/agent/src/state-io/`
- `apps/api/src/services/agent-thread-sync.ts`
