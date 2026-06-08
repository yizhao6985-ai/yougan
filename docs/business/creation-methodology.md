# 创作方法论：分阶段确认

有感的核心产品逻辑是**分阶段确认**，而非单次 Prompt 生成全文。每件作品采用 **单线 version** 记录对用户可见的里程碑（见 [version-graph.md](../technical/version-graph.md)）。

Agent 每条用户消息先经 **回合队列**（`turnQueue`）编排（见 [agent-turn-queue.md](../technical/agent-turn-queue.md)），再路由到对话子图。**聊天中的状态变更**一律走对话子图（有回复与工具）；**侧栏直改**走 `PATCH Work` + API 同步 LangGraph thread。

## 总流程

```text
灵感（brief）──► 大纲（outline）──► 创作（plan + draft）──► 发布
      │                │                    ▲
      │                │                    │
      └─ 侧栏 PATCH ───┴─ API 线程同步 ─────┘
      （无 Agent run、无对话回复）

提问模式（ask）：并行答疑，不直接改 plan/draft
```

同一件作品内可有多轮对话，**共享同一份** `profile / brief / outline / plan / draft`。换平台、换选题请 **另存为新作品**。

## 数据对象

| 对象 | 字段 | 用户可见 | 说明 |
|------|------|----------|------|
| `WorkProfile` | `profile` | 是（侧栏） | 平台、体裁、形式、风格、参考素材等 |
| `WorkBrief` | `brief.requirements[]` | 是 | 已确认创作需求 |
| `WorkOutline` | `outline.sections[]` | 是 | 内容结构大纲（非部门分工） |
| `WorkProductionPlan` | `plan` | 否（内部） | 创意总监制作任务 |
| `WorkDraft` | `draft` | 是（预览） | 成稿正文等 |

## 阶段一：灵感（inspiration）

**目标**：探索方向，把**已确认**的需求写入 brief。

| 入口 | 说明 |
|------|------|
| `inspiration` 队列项 | 多轮对话 + 工具（改 brief / profile） |
| 侧栏 PATCH | 直改物化列并同步 thread |

**对话工具**（仅灵感子图）：`add/update/delete_brief_requirement`、`clear_brief`

## 阶段二：大纲（outline）

**目标**：敲定内容结构（章节/段落要点），再进入创作。

| 入口 | 说明 |
|------|------|
| `outline` 任务 | 多轮讨论 + 大纲工具；`prepare-turn` 可在有 brief 无大纲时 bootstrap |
| 侧栏 PATCH | 直改 outline 条目 |
| 对话 `revise_outline` | 整体换方向时重做大纲 |

**对话工具**（仅大纲子图）：`add/update/delete_outline_section`、`clear_outline`、`revise_outline`

## 阶段三：创作（creation）

**目标**：创意总监根据 brief + outline 生成内部 `plan`，再按计划出 `draft`。

- 入口任务：`creation`
- 需 brief 与 outline 具备有效内容（见 `creative-director.logic.ts`）
- 成稿变更写入版本时间轴（`draft` phase）

## 阶段四：提问（ask）

答疑与咨询；可通过 `add_brief_from_ask` 记入 brief，**不**改大纲与 plan/draft。

## 聊天 vs 侧栏（选型）

| 用户意图 | 路径 |
|----------|------|
| 侧栏删改 brief/大纲、改 profile、传参考图 | `PATCH /api/works/:id` → DB + `syncMaterializedStateToAgentThreads` |
| 聊天里改 brief/大纲/profile、一起讨论 | `inspiration` / `outline` 对话子图 |
| 出稿、改稿 | `creation` 子图 |

## 版本与另存

- **版本记录**：仅 `draft`（作品预览）里程碑进入 `WorkVersion` 时间轴
- **brief / outline / plan**：更新物化列，不单独占版本节点
- **回到这一版**：restore
- **另存为新作品**：`POST /api/works/:id/duplicate`（平行探索）
