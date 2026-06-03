# @yougan/agent

Node.js LangGraph 服务：**回合队列**编排 + 四条对话子图（灵感 / 大纲 / 创作 / 提问）。聊天中的状态变更均经对话子图（可见回复与工具）；UI 直改作品状态由 API `PATCH Work` + 线程同步完成。

由 `@langchain/langgraph-cli` 在开发模式启动，默认 `http://localhost:2024`。生产环境由 `apps/api` 的 `/langgraph` 代理访问，不应对公网直接暴露（无 JWT 层）。

## Graph 注册

| Graph ID | 入口 | 用途 |
|----------|------|------|
| `yougan` | `src/graph.ts:graph` | 主创作流 |

Checkpoint：**Agent 专用 Postgres**（`POSTGRES_URI`，默认 `:5433`）。

## 开发

```bash
cp apps/agent/.env.example apps/agent/.env
docker compose up -d
pnpm dev:agent
```

## 目录结构

```
src/
├── graph.ts
├── lib/outline/                  # bootstrap、全量修订、schema（子图复用）
├── conditional-edges/
│   ├── route-by-entry.ts
│   ├── route-by-turn-queue.ts    # 队列项 → 对话子图
│   └── route-after-turn-queue.ts
├── nodes/
│   ├── resolve-turn-queue/       # planTurnQueue → turnQueue（nodes/plan/）
│   ├── turn-queue/               # 流程：dispatch / advance
│   ├── inspiration|outline|creation|ask/
│   │   └── nodes/                # 子图 LangGraph 节点；可递归 nodes/（如 tools/nodes/）
│   └── next-step-suggestions/  # nodes/run、opening-topic、after-turn、shared
├── tools/
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
| `#agent/tools/*` | `src/tools/*`（共用 tool 定义） |
| `#agent/state.js` | `src/state.ts` |
| `#agent/schema.js` | `src/schema.ts` |
| `#agent/env.js` | `src/env.ts` |

同一子图内的节点仍用相对路径（如 `../tools/index.js` 引用该子图的 Tool 节点，而非 `src/tools/index.ts`）。

## 主图流程

```text
resolveTurnQueue → dispatchTurnQueue → [*Graph] → advanceTurnQueue → …
```

| TurnQueueKind | 节点 | 说明 |
|---------------|------|------|
| `outline` | `outlineGraph` | llmCall ⇄ tools；prepare-turn 可 bootstrap 空大纲 |
| `inspiration` | `inspirationGraph` | 改 brief 等 |
| `creation` | `creationGraph` | 计划 + 出稿 |
| `ask` | `askGraph` | 答疑 |

详见 [docs/technical/agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)。

## 模型分工

| 场景 | 位置 | 模型 |
|------|------|------|
| 对话子图 | `llm/dashscope.ts` | qwen3.7-max |
| 队列解析 | `resolve-turn-queue/` | deepseek-v4-pro |
| 下一步建议 | `next-step-suggestions/` | deepseek-v4-pro |

## 与 API

- 物化列：`profile`、`brief`、`outline`、`plan`、`draft`
- UI 更新物化列后 API 同步 LangGraph thread（`agent-thread-sync`）
- Stream 字段含 `turnQueue`、`activeTurnKind`、`completedTurnKinds`
- 详见 [revision-graph.md](../../docs/technical/revision-graph.md)

修改 `state.ts` 或 graph 后重启 `pnpm dev:agent`。

## 相关文档

- [agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)
- [creation-methodology.md](../../docs/business/creation-methodology.md)
