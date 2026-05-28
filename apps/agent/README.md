# @yougan/agent

Node.js LangGraph 服务，实现「有感」三阶段创作图：**灵感 → 大纲 → 创作**。

由 `@langchain/langgraph-cli` 在开发模式启动，默认 `http://localhost:2024`。生产环境由 `apps/api` 的 `/langgraph` 代理访问，不应对公网直接暴露（无 JWT 层）。

## Graph 注册

`langgraph.json` 中声明：

| Graph ID | 入口 | 用途 |
|----------|------|------|
| `yougan` | `src/graph.ts:graph` | 主创作流（按 `mode` 路由子图） |
| `inspiration-recommendations` | `src/agents/inspiration-recommendations/graph.ts:graph` | 侧栏灵感推荐（独立调用） |

Checkpoint 持久化到 **Agent 专用 Postgres**（`POSTGRES_URI`，默认 `:5433`），与 API 业务库分离。

## 开发

在 monorepo 根目录：

```bash
cp apps/agent/.env.example apps/agent/.env
# 填入 MINIMAX_API_KEY、DEEPSEEK_API_KEY 等
docker compose up -d   # 确保 postgres-agent 已启动
pnpm dev:agent
```

或在 `apps/agent` 目录：

```bash
cp .env.example .env
pnpm dev
```

LangGraph Studio 默认不自动打开浏览器（`--no-browser`）。

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | `langgraphjs dev --port 2024` |
| `pnpm build` / `pnpm check-types` | TypeScript 检查 |

## 环境变量

复制 `.env.example` 为 `.env`：

| 变量 | 必填 | 说明 |
|------|------|------|
| `POSTGRES_URI` | 是 | Checkpoint 库，默认 `postgresql://yougan:yougan@localhost:5433/yougan_agent` |
| `MINIMAX_API_KEY` | 是 | 主对话与工具链（Anthropic 兼容端点） |
| `MINIMAX_CHAT_BASE_URL` | 否 | 默认 `https://api.minimaxi.com/anthropic` |
| `MINIMAX_CHAT_MODEL` | 否 | 默认 `MiniMax-M2.7` |
| `DEEPSEEK_API_KEY` | 建议 | 结构化输出：灵感选项、推荐、灵感→大纲同步 |
| `LLM_STREAMING` | 否 | 默认 `true` |
| `MINIMAX_TEMPERATURE` / `DEEPSEEK_TEMPERATURE` | 否 | 默认 `0.7` / `0.3` |
| `LANGSMITH_*` | 否 | 可选链路追踪 |

## 目录结构

```
src/
├── graph.ts                        # yougan 主 graph：mode → 子图路由
├── state.ts / schemas.ts           # LangGraph 状态与 Zod 类型
├── llm/
│   ├── minimax.ts                  # createChatModel（主对话）
│   └── deepseek.ts                 # createDeepSeekModel（结构化）
├── lib/
│   ├── inspiration-merge.ts        # 灵感合并策略
│   └── structured-output.ts        # invoke/stream 结构化输出
├── prompts/                        # 跨 agent 上下文片段
├── tools/                          # 共用工具（mode、pending-change、profile…）
└── agents/
    ├── inspiration/                # 灵感对话子图
    ├── outline/                    # 大纲子图 + sync-from-inspiration
    ├── creation/                   # 创作出稿子图
    └── inspiration-recommendations/  # 推荐 graph
```

各 agent 目录内自行维护 `prompts/`、`tools/`、`agent.ts`；`llm/` 仅提供模型工厂，不含业务提示词。

## 创作流程

```text
灵感模式 ──确认需求──► 切换大纲模式 ──同步/编辑大纲──► complete_outline
                                                      │
                                                      ▼
                                            创作模式按大纲出稿
                                                      │
                                                      ▼
                                            complete_execution（更新已实现状态）
```

**灵感工具**：`confirm_requirement`、`update_requirement`、`delete_requirement`、`clear_inspirations`。确认后即时写入侧栏状态。

**大纲**：进入大纲模式时可自动 `sync_outline_from_inspiration`（DeepSeek）；也可手动触发。`complete_outline` 定稿后进入创作。

**创作**：按已定稿大纲与用户最新需求合并 `pending_changes` 后执行；`complete_execution` 总结修改并清空待执行列表。

## 模型分工

| 场景 | 实现位置 | 模型 |
|------|----------|------|
| 灵感 / 大纲 / 创作对话与工具 | `llm/minimax.ts` | MiniMax |
| 灵感结构化选项轮 | `agents/inspiration/agent.ts` | MiniMax（`responseFormat`） |
| 灵感 → 大纲同步 | `agents/outline/sync-from-inspiration.ts` | DeepSeek |
| 灵感推荐 | `agents/inspiration-recommendations/` | DeepSeek |

## 与 API 的协作

- API 在 `Work` 表保存 `threadId`、`mode` 及 `inspiration` / `outline` / `creation` JSON
- 前端经 `/langgraph` 代理发起 run；API 注入作品上下文供 tools 读取
- Agent checkpoint 仅存对话与图状态，不替代 API 侧的作品持久化

修改 `state.ts` 或 graph 拓扑后，需重启 `pnpm dev:agent`；已有 thread 的 checkpoint 可能需新 thread 或清库调试。

## 阅读代码建议

建议按下列顺序阅读（各模块顶部常有注释）：

1. **`schemas.ts`** — `WorkInspiration` / `WorkOutline` / `GeneratedContent` 数据分工
2. **`state.ts`** — 字段与 reducer（尤其 `inspiration` merge）
3. **`graph.ts`** — `mode` 路由到子图
4. **`agents/inspiration/`** — React agent + `apply_output`
5. **`agents/outline/graph.ts`** + **`sync-from-inspiration.ts`**
6. **`agents/creation/tools.ts`** — 出稿与 `complete_execution`
7. **`tools/`** — 跨模式共用工具
8. **`lib/structured-output.ts`** — 结构化流式封装

## 技术栈

- LangGraph JS、`@langchain/langgraph-checkpoint-postgres`
- `@langchain/anthropic`（兼容 MiniMax / DeepSeek 端点）
- Zod、`langchain` tools

## 相关文档

- [根目录 README](../../README.md)
- [apps/api/README.md](../api/README.md) — LangGraph 代理与 `X-Work-Id`
- [apps/web/README.md](../web/README.md) — `useStream` 前端集成
