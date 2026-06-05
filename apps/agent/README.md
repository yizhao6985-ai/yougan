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
| 计划者 | `nodes/planner/` | `orchestrateTurn` | 解析用户意图 → `turnQueue[]`，fork `staging` |
| 执行者 | `nodes/executor/` | `dispatchTurnQueue` / `advanceTurnQueue` + 子图 | 按队列路由并执行 profile / production / ask |
| 验收者 | `nodes/verifier/` | `verifyTurn` / `commitTurn` | 验收通过 → 生成 `nextStepSuggestions` → 提交 canonical |

路由边：`nodes/edges/`

### 内层 production（制作子图）

| 角色 | 目录 | 节点 | 职责 |
|------|------|------|------|
| 计划者 | `planner/` | ensureProfile / resolveContentSpec / scheduleProduction | 补全方案、解析规格、制定制作计划 |
| 创作者 | `creator/` | llmCall / designLlmCall ⇄ tools | 按任务产出文案、设计、预览 |
| 验收者 | `inspector/` | inspectProduction | 单任务质检，不通过则重试 |

profile / ask 子图由 `createChatLoopGraph` 生成（直连 llm ⇄ tools）；方案缺口由 production 的 ensureProfile 在进入制作时补全。

共享工厂见 `lib/graph/`：`createLlmCallNode`、`createChatLoopGraph`、`after-llm`。

## 目录结构

```
src/
├── graph.ts
├── nodes/
│   ├── edges/                        # 主图条件路由
│   ├── planner/                      # 外层·计划者
│   ├── executor/                     # 外层·执行者
│   │   ├── dispatch.ts
│   │   ├── advance.ts
│   │   └── subgraphs/
│   │       ├── profile/
│   │       ├── ask/
│   │       └── production/           # 内层 planner / creator / inspector
│   └── verifier/                     # 外层·验收者
│       ├── index.ts                  # verifyTurn
│       ├── commit.ts
│       └── suggestions/
├── lib/
├── prompt/
└── state.ts
```

## 路径别名

`package.json` 的 `imports` 与 `tsconfig` 的 `paths` 对齐，从 `src/` 引用时用 `#agent/` 前缀，避免深层 `../../../../`：

| 别名 | 指向 |
|------|------|
| `#agent/lib/*` | `src/lib/*` |
| `#agent/llm/*` | `src/llm/*` |
| `#agent/prompt/*` | `src/prompt/*` |
| `#agent/state.js` | `src/state.ts` |
| `#agent/schema.js` | `src/schema.ts` |
| `#agent/env.js` | `src/env.ts` |

profile 子图：`graph.ts`、`prompt.ts`、`tools/`（`index.ts` 聚合 profile-tools / reference-tools / revise-profile）；ask 为 `graph.ts`、`prompt.ts`、`tools.ts`。

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

全部经 **阿里百炼 DashScope**（`DASHSCOPE_API_KEY`，OpenAI 兼容 `compatible-mode/v1`）。默认模型见 `src/llm/models.ts`，可用 `LLM_MODEL_*` 覆盖。

## 模型分工

| 场景 | 位置 | 默认模型 |
|------|------|----------|
| 对话子图、参考解析 | `llm/dashscope.ts` `createChatModel` | qwen3.7-max |
| 队列解析、下一步建议、创意总监 | `createStructuredModel` | deepseek-v4-pro |
| 文生图 | `llm/dashscope-image.ts` | qwen-image-2.0-pro |

## 相关文档

- [agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)
- [revision-graph.md](../../docs/technical/revision-graph.md)
