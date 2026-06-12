# 创作方法论：分阶段确认

有感的核心产品逻辑是**分阶段确认**，而非单次 Prompt 生成全文。每件作品采用 **单线 version** 记录对用户可见的里程碑（见 [version-graph.md](../technical/version-graph.md)）。

Agent 每条用户消息先经 **回合队列**（`turn.queue`）workflow（见 [agent-turn-queue.md](../technical/agent-turn-queue.md)），再路由到对话子图。**聊天中的状态变更**一律走对话子图（有回复与工具）；**侧栏直改**走 `PATCH Work` + API 同步 LangGraph thread。

## 总流程

```text
定方案（profile）──► 备参考（reference）──► 制作（productionPlan + preview）──► 发布
      │                      │                           ▲
      │                      │                           │
      └─ 侧栏 PATCH ─────────┴─ API 线程同步 ─────────────┘
      （无 Agent run、无对话回复）

提问（ask）：并行答疑，不直接改 preview / productionPlan
```

同一件作品内可有多轮对话，**共享同一份** `profile / references / productionPlan / preview`。换平台、换选题请 **另存为新作品**。

## 数据对象

| 对象 | 字段 | 用户可见 | 说明 |
|------|------|----------|------|
| `WorkProfile` | `profile` | 是（侧栏「方案」） | delivery、expression、blueprint、guardrails、params |
| `WorkReference[]` | `references` | 是（侧栏「参考」） | 参考素材及分析、借鉴意图 |
| `WorkProductionPlan` | `productionPlan` | 否（内部） | 创意总监制作任务 |
| `WorkPreview` | `preview` | 是（侧栏「作品」） | 成稿标题、正文等 |

## 阶段一：定方案（profile）

**目标**：确认做什么、什么形式、面向谁、内容结构与创作规则。

| 入口 | 说明 |
|------|------|
| `profile` 队列项 | 多轮对话 + `profile_apply_patch` 工具 |
| 侧栏 PATCH | 直改物化列并同步 thread |

**对话工具**（profile 子图）：`profile_apply_patch`（批量改 delivery、expression、blueprint、guardrails 等）

## 阶段二：备参考（reference）

**目标**：上传或维护参考素材，分析内容并记录借鉴意图。

| 入口 | 说明 |
|------|------|
| 有附件的消息 | 系统自动前置 `reference` → `analyzeNewAssets` |
| 删/改参考 | 模型判定 `reference` 队列项 → `mutateReferences` |
| 侧栏 PATCH | 直改 `references` 并同步 thread |

参考子图：`analyzeNewAssets` → `mutateReferences` → `summarizeReferences`（对用户可见摘要）。

## 阶段三：制作（production）

**目标**：根据方案制定内部 `productionPlan`，再按计划产出 `preview`。

- 入口：`production` 队列项
- 子图（原子流水线）：用户一次开写 → `planProduction` → `executeWriting`/`executeDesign` 自动逐任务产出 → `acceptTask`（不过则重产，超 2 次失败结束）→ `assemblePreview`；中途不需用户交互
- 进入制作由 `planTurnQueue` 识别用户**明确**出稿/开写/改稿意图；仅讨论方案或描述创作方向时走 `profile`

## 阶段四：提问（ask）

答疑与咨询；用户明确要求「记入方案」时由 `planTurnQueue` 路由到 `profile`，**不**直接改 `preview` / `productionPlan`。

## 聊天 vs 侧栏（选型）

| 用户意图 | 路径 |
|----------|------|
| 侧栏改方案、参考、作品预览 | `PATCH /api/works/:id` → DB + `syncMaterializedStateToAgentThreads` |
| 聊天里改方案、参考、一起讨论 | `profile` / `reference` 对话子图 |
| 出稿、改稿 | `production` 子图 |

## 版本与另存

- **版本记录**：仅 `preview`（作品预览）里程碑进入 `WorkVersion` 时间轴
- **profile / references / productionPlan**：更新物化列，不单独占版本节点
- **回到这一版**：restore
- **另存为新作品**：`POST /api/works/:id/duplicate`（平行探索）
