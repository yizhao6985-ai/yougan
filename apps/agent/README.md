# @yougan/agent

Node.js LangGraph 服务：**回合队列** workflow + 四条对话子图（reference / profile / production / ask）。聊天中的状态变更均经对话子图（可见回复与工具）；UI 直改作品状态由 API `PATCH Work` + 线程同步完成。

由 `@langchain/langgraph-cli` 在开发模式启动，默认 `http://localhost:2024`。生产环境由 `apps/api` 的 `/langgraph` 代理访问，不应对公网直接暴露（无 JWT 层）。

## Graph 注册

| Graph ID | 入口 | 用途 |
|----------|------|------|
| `yougan` | `src/graph.ts:graph` | 主创作流 |

Checkpoint：**与 API 共用 Postgres**（`POSTGRES_URI`，默认 `:5432/yougan_agent`）。

## 两层三分架构

### 外层 turn（主图）

| 角色 | 目录 | 节点 | 职责 |
|------|------|------|------|
| 计划者 | `nodes/plan-turn-queue/` | `planTurnQueue` | 解析用户意图 → `turnQueue[]`，fork `staging` |
| 执行者 | `state-graph/` | `dispatchTurnQueue` / `advanceTurnQueue` + 子图 | 按队列路由并执行 reference / profile / production / ask |
| 系统收尾 | `post-commit/`、`summarize-messages/` | `commitTurn` →（条件）`postCommit` → `summarizeMessages` → END | 首条 human 生成对话标题；messages 过多时滚动摘要 |

图接线：`src/graph.ts`；`state-graph/` 含 `nodes/`、`conditional-edges/`、`subgraphs/*/graph.ts`

### 内层子图（`state-graph/subgraphs/`）

**reference**：`preprocessReferences` ⇄ `runPreprocessTools` → `mutateReferences` ⇄ `runMutateTools` → `finalizeReferences`。预处理未分析资源；按意图原子工具删改参考。

**profile**：`mutateProfile` ⇄ `runProfileTools` → `finalizeProfile`。按意图原子工具改方案；末位模板回复。

**suggestions**：`generateSuggestions`。`commitTurn` 后执行；开屏 9 条 / 回合末 4 条，写入 `nextStepSuggestions`。

**production**（`subgraphs/production/README.md`）：`planProduction` → `dispatchTask` → `execute*` → `acceptTask` → `routeProduction` →（`dispatchTask`、`assemblePreview`、计划为空或验收 3 次失败时直达 `finalizeProduction`）→ `finalizeProduction`。

**ask**：`answerQuestion` ⇄ `runAskTools`（`ToolNode` + `toolsCondition`）。

对话环：`nodes/mutate-profile/`、`answer-question/`、`execute-writing/`、`execute-design/`（bindTools + stream）+ `run-*-tools/`（`ToolNode` + `tools/`）+ `conditional-edges/after-*.ts`（按执行位置命名）。

## 目录结构

```
src/
├── graph.ts                          # langgraph 注册入口
├── state-graph/                      # 主图 + subgraphs/
├── state-io/                          # state-io (get / patch-pending / lifecycle)
├── messages/
├── llm/
│   ├── providers/                    # 创建 Chat / 结构化 / 文生图客户端
│   └── invoke/                       # streamChat / invokeStructured / invokeMultimodalStructured
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
START → planTurnQueue → dispatchTurnQueue → [*Graph] → advanceTurnQueue
  → commitTurn → suggestionsGraph → summarizeMessages → END
（开屏 queue 为空，直接 commit 后生成 suggestions）
```

| TurnQueueKind | 子图 | 说明 |
|---------------|------|------|
| `reference` | `referenceGraph` | 分析新附件 / 删改参考素材 |
| `profile` | `profileGraph` | 改作品方案 |
| `production` | `productionGraph` | 制作计划 + 出稿 + 质检 |
| `ask` | `askGraph` | 答疑 |

`nextStepSuggestions` 不在队列内，由 `commitTurn` 后的 `suggestionsGraph` 统一生成。

详见 [docs/technical/agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)。

## LLM 接入

统一走阿里百炼 DashScope。环境变量只配 `DASHSCOPE_API_KEY` 与 `DASHSCOPE_BASE_URL`；**模型 ID 在代码里维护**（`src/llm/providers/catalog.ts` 的 `DASHSCOPE_MODELS`）。

| 角色 | 配置字段 | 当前默认 |
|------|----------|----------|
| 文本 Chat | `DASHSCOPE_MODELS.chat` | `glm-5.2` |
| 多模态分析 | `DASHSCOPE_MODELS.multimodal` | `qwen3.5-omni-flash-realtime` |
| 文生图 | `DASHSCOPE_MODELS.image` | `qwen-image-2.0-pro-2026-04-22` |

## llm 分层

| 子目录 | 内容 |
|--------|------|
| `llm/providers/` | `createChatModel`、`createMultimodalChatModel`、`generateDesignImage` |
| `llm/invoke/` | `streamChat`、`invokeStructured`、`invokeMultimodalStructured` |

## 模型分工

| 场景 | 工厂 | 调用 | 模型 |
|------|------|------|------|
| 对话子图 | `createChatModel` | `streamChat` | Chat（默认 glm-5.2） |
| 参考素材分析 | `createMultimodalChatModel` | `invokeMultimodalStructured` | Omni |
| 结构化 work | `createChatModel` | `invokeStructured` | Chat |
| 文生图 | `generateDesignImage` | — | qwen-image |

## 相关文档

- [agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)
- [version-graph.md](../../docs/technical/version-graph.md)
