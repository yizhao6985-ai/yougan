# @yougan/agent

Node.js LangGraph 服务：**两层三分**编排 + 对话子图。聊天中的状态变更均经对话子图（可见回复与工具）；UI 直改作品状态由 API `PATCH Work` + 线程同步完成。

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
| 计划者 | `nodes/orchestrateTurn/` | `orchestrateTurn` | 解析用户意图 → `turnQueue[]`，fork `staging` |
| 执行者 | `state-graph/` | `dispatchTurnQueue` / `advanceTurnQueue` + 子图 | 按队列路由并执行 profile / production / ask |
| 验收者 | `nodes/verifyTurn/` | `verifyTurn` / `commitTurn` | 验收通过 → 生成 `nextStepSuggestions` → 提交 canonical |

图接线：`src/graph.ts`；`state-graph/` 含 `nodes/`、`conditional-edges/`、`subgraphs/*/graph.ts`

### 内层子图（`state-graph/subgraphs/`）

**production**：`ensureProfile` → `resolveContentSpec` → `scheduleProduction` → `llmCall` / `designLlmCall` ⇄ `tools` →（work）`generateDraft` / `spawnSpecialist` → `inspectProduction`。tool 仅入队或改 state，LLM 重活在 work node。

**profile**：`llmCall` ⇄ `tools` →（work）`parseReferenceText` / `parseReferenceImage` → 回 `llmCall`。

**ask**：`llmCall` ⇄ `runTools`（`ToolNode` + `toolsCondition`）。

LLM 环：`nodes/llmCall/node.ts`（bindTools + stream）+ `nodes/runTools/node.ts`（`ToolNode`）+ `conditional-edges/llm-tool-calls.ts`（`toolsCondition`）。

## 目录结构

```
src/
├── graph.ts                          # langgraph 注册入口
├── state-graph/                      # 主图 + subgraphs/
├── runtime/                          # state-readers / staging-writes
├── messages/
├── model/                            # 模型工厂、provider
├── llm/                              # invoke / stream / structured-output
├── system-prompt.ts                  # 全局系统提示词 + composeSystemPrompt
└── state.ts
```

详见 [AGENTS.md](./AGENTS.md)。

## 路径别名

`package.json` 的 `imports` 与 `tsconfig` 的 `paths` 对齐，从 `src/` 引用时用 `#agent/` 前缀，避免深层 `../../../../`：

| 别名 | 指向 |
|------|------|
| `#agent/runtime/*` | `src/runtime/*` |
| `#agent/messages/*` | `src/messages/*` |
| `#agent/model/*` | `src/model/*` |
| `#agent/llm/*` | `src/llm/*` |
| `#agent/system-prompt.js` | `src/system-prompt.ts` |
| `#agent/state.js` | `src/state.ts` |
| `#agent/env.js` | `src/env.ts` |

类型与领域逻辑统一 `import from "@yougan/domain"`。主图接线在 `src/graph.ts`，子图在 `state-graph/subgraphs/*/graph.ts`。

## 主图流程

```text
START
  ├─ 空 thread → verifyTurn（开屏 7 条建议）→ END
  └─ 有消息 → orchestrateTurn → dispatchTurnQueue → [*Graph] → advanceTurnQueue
         → verifyTurn（对话流 4 条建议）→ commitTurn → END
```

| TurnQueueKind | 子图 | 说明 |
|---------------|------|------|
| `profile` | `profileGraph` | 改作品方案 |
| `production` | `productionGraph` | 制作计划 + 出稿 + 质检 |
| `ask` | `askGraph` | 答疑 |

详见 [docs/technical/agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)。

## LLM 接入

全部经 **阿里百炼 DashScope**（`DASHSCOPE_API_KEY`，OpenAI 兼容 `compatible-mode/v1`）。默认模型见 `src/model/models.ts`，可用 `LLM_MODEL_*` 覆盖。

## 模型分工

| 场景 | 位置 | 默认模型 |
|------|------|----------|
| 对话子图、参考解析 | `model/dashscope.ts` `createChatModel` | qwen3.7-max |
| 队列解析、下一步建议、创意总监 | `createStructuredModel` | deepseek-v4-pro |
| 文生图 | `model/dashscope-image.ts` | qwen-image-2.0-pro |

## 相关文档

- [agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)
- [revision-graph.md](../../docs/technical/revision-graph.md)
