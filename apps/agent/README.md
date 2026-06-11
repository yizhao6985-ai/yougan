# @yougan/agent

Node.js LangGraph 服务：**回合队列** workflow + 四条对话子图（reference / profile / production / ask）。聊天中的状态变更均经对话子图（可见回复与工具）；UI 直改作品状态由 API `PATCH Work` + 线程同步完成。

由 `@langchain/langgraph-cli` 在开发模式启动，默认 `http://localhost:2024`。生产环境由 `apps/api` 的 `/langgraph` 代理访问，不应对公网直接暴露（无 JWT 层）。

## Graph 注册

| Graph ID | 入口 | 用途 |
|----------|------|------|
| `yougan` | `src/graph.ts:graph` | 主创作流 |

Checkpoint：**Agent 专用 Postgres**（`POSTGRES_URI`，默认 `:5433`）。

## 两层三分架构

### 外层 turn（主图）

| 角色 | 目录 | 节点 | 职责 |
|------|------|------|------|
| 计划者 | `nodes/plan-turn-queue/` | `planTurnQueue` | 解析用户意图 → `turnQueue[]`，fork `staging` |
| 执行者 | `state-graph/` | `dispatchTurnQueue` / `advanceTurnQueue` + 子图 | 按队列路由并执行 reference / profile / production / ask |
| 验收者 | `generate-suggestions` 等 | `commitTurn` → `forkPostCommit` → `generateSuggestions` ∥ `generateTitle` | 取消回合在 `commitTurn` rollback；建议生成节点会跳过 |

图接线：`src/graph.ts`；`state-graph/` 含 `nodes/`、`conditional-edges/`、`subgraphs/*/graph.ts`

### 内层子图（`state-graph/subgraphs/`）

**reference**：`analyzeNewAssets` → `mutateReferences` → `summarizeReferences`。新附件分析入库；无新附件时删改参考。

**profile**：`consultProfile` ⇄ `runProfileTools`（`profile_apply_patch` 批量改方案）。

**production**：`schedulePlan` → `directWriting` / `directDesign` ⇄ `runProductionTools` → `generateDraft` / `spawnSpecialist` → `inspectDeliverable`。进入制作由 `planTurnQueue` 识别用户出稿意图；子图基于现有方案直接执行，不因方案不完整而阻断。

**ask**：`answerQuestion` ⇄ `runAskTools`（`ToolNode` + `toolsCondition`）。

对话环：`nodes/consult-profile/`、`answer-question/`、`direct-writing/`、`direct-design/`（bindTools + stream）+ `run-*-tools/`（`ToolNode` + `tools/`）+ `conditional-edges/after-*.ts`（按执行位置命名）。

## 目录结构

```
src/
├── graph.ts                          # langgraph 注册入口
├── state-graph/                      # 主图 + subgraphs/
├── state-io/                          # state-io (get / patch-pending / lifecycle)
├── messages/
├── llm/
│   ├── providers/                    # 创建 Chat / 结构化 / 文生图客户端
│   └── invoke/                       # streamChat / invokeStructured
├── system-prompt.ts                  # 全局系统提示词 + composeSystemPrompt
└── state.ts
```

详见 [AGENTS.md](./AGENTS.md)。

## 路径别名

`package.json` 的 `imports` 与 `tsconfig` 的 `paths` 对齐，从 `src/` 引用时用 `#agent/` 前缀，避免深层 `../../../../`：

| 别名 | 指向 |
|------|------|
| `#agent/state-io/*` | `src/state-io/*` |
| `#agent/messages/*` | `src/messages/*` |
| `#agent/llm/providers/index.js` | 模型工厂 |
| `#agent/llm/invoke/index.js` | LLM 调用 |
| `#agent/system-prompt.js` | `src/system-prompt.ts` |
| `#agent/state.js` | `src/state.ts` |
| `#agent/env.js` | `src/env.ts` |

类型与领域逻辑统一 `import from "@yougan/domain"`。主图接线在 `src/graph.ts`，子图在 `state-graph/subgraphs/*/graph.ts`。

## 主图流程

```text
START
  ├─ 空 thread → generateSuggestions（开屏 7 条建议）→ END
  └─ 有消息 → planTurnQueue → dispatchTurnQueue → [*Graph] → advanceTurnQueue
         → commitTurn → forkPostCommit → generateSuggestions ∥ generateTitle → END
```

| TurnQueueKind | 子图 | 说明 |
|---------------|------|------|
| `reference` | `referenceGraph` | 分析新附件 / 删改参考素材 |
| `profile` | `profileGraph` | 改作品方案 |
| `production` | `productionGraph` | 制作计划 + 出稿 + 质检 |
| `ask` | `askGraph` | 答疑 |

详见 [docs/technical/agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)。

## LLM 接入

两个 Chat 模型，分工固定：

| 模型 | 环境变量 | 用途 |
|------|----------|------|
| **Qwen** | `DASHSCOPE_API_KEY` + `LLM_MODEL` | 对话、结构化 work |
| **MiniMax** | `MINIMAX_API_KEY` + `MINIMAX_MODEL` | 多模态（参考素材分析等） |

默认模型 ID 见 `src/llm/providers/catalog.ts`。文生图 / ASR 仍走百炼原生 API。

## llm 分层

| 子目录 | 内容 |
|--------|------|
| `llm/providers/` | `createChatModel`、`generateImage` |
| `llm/invoke/` | `streamChat`、`invokeStructured` |

## 模型分工

| 场景 | 工厂 | 调用 | 模型 |
|------|------|------|------|
| 对话子图 | `createChatModel` | `streamChat` | Qwen |
| 参考素材分析 | `createMultimodalChatModel` | `invokeStructured` | MiniMax |
| 结构化 work | `createChatModel` | `invokeStructured` | Qwen |
| 文生图 | `generateImage` | — | 百炼 qwen-image |

## 相关文档

- [agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)
- [version-graph.md](../../docs/technical/version-graph.md)
