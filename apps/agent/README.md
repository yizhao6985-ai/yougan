# @yougan/agent

Node.js LangGraph 服务，实现「有感」四模式创作图：**灵感 · 大纲 · 创作 · 提问**。

由 `@langchain/langgraph-cli` 在开发模式启动，默认 `http://localhost:2024`。生产环境由 `apps/api` 的 `/langgraph` 代理访问，不应对公网直接暴露（无 JWT 层）。

## Graph 注册

`langgraph.json` 中声明：

| Graph ID | 入口 | 用途 |
|----------|------|------|
| `yougan` | `src/graph.ts:graph` | 主创作流（每轮解析意图后按 `mode` 路由） |

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
| `DEEPSEEK_API_KEY` | 建议 | 结构化输出：灵感建议、大纲 agent |
| `LLM_STREAMING` | 否 | 默认 `true` |
| `MINIMAX_TEMPERATURE` / `DEEPSEEK_TEMPERATURE` | 否 | 默认 `0.7` / `0.3` |
| `LANGSMITH_*` | 否 | 可选链路追踪 |

## 目录结构

**`nodes/` 与 graph 是同一概念**：简单 node 是一个文件夹；复合 node（子图）在文件夹内递归 `graph.ts` + `conditional-edges/` + `nodes/`。

- **叶子 node**：`nodes/<name>.ts`（单文件，不建文件夹）
- **复合 node（子图）**：`nodes/<name>/` 内含 `graph.ts`，可再递归 `conditional-edges/`、`nodes/`
- **条件边**：`conditional-edges/<边名>.ts`（单文件，如 `after-llm.ts`）
- **node 实现**：`<动作>.ts`（如 `resolve-turn-plan.ts`、`generate-opening-suggestions.ts`）
- **附属模块**：`<node>.<part>.ts`（如 `llm-call.prompt.ts`、`generate-suggestions.logic.ts`）
- **跨 node 共享**：根目录 `tools/`、`prompt/`、`schema.ts`、`lib/`

```
src/
├── graph.ts
├── conditional-edges/route-by-entry.ts  # 空 thread → 开场建议；否则 resolveTurnQueue
├── conditional-edges/route-by-turn-task.ts
├── conditional-edges/route-after-turn-task.ts
├── conditional-edges/route-after-subgraph.ts
├── nodes/resolve-turn-queue/  # 结构化解析本轮任务队列
├── nodes/turn-task/           # 各任务路径 + dispatch / advance 出队
├── nodes/update-brief-suggestions/  # 空 thread 开场 + 灵感回合后快捷选项
├── nodes/
│   ├── inspiration/
│   │   ├── graph.ts
│   │   ├── conditional-edges/after-llm.ts
│   │   └── nodes/
│   │       ├── prepare-turn.ts
│   │       ├── llm-call.ts
│   │       ├── llm-call.prompt.ts
│   │       └── tools.ts
│   ├── ask/
│   └── creation/
```

构图约定：

- **llm-call**：`llm-call.ts` + `llm-call.prompt.ts`；`export const llmCall: GraphNode<...>`
- **tools**：`tools.ts` 导出 `toolNode`；各 tool 实现为同目录独立 `.ts`
- **复合 node**：`nodes/<name>/graph.ts`，根 `graph.ts` 用 `.addNode("<name>", subGraph)` 挂载
- **条件边**：`conditional-edges/<name>.ts` 导出 `from`、`shouldContinue` / `routeByX`、`paths`

## 创作流程

```text
用户消息 → resolveTurnQueue（LLM 结构化输出 tasks[]）→ 按序 dispatch → 各任务路径 → advance → 队列空则结束/建议
任务类型：references / brief / ensure_outline / outline_patch / outline / inspiration / creation / ask
静默任务（patch）：references、brief、outline_patch、ensure_outline
对话任务（子图环）：inspiration、outline、creation、ask
```

**灵感工具**：`add/update/delete_brief_requirement`、`clear_brief`

**大纲工具**（`nodes/outline/`）：`add/update/delete_outline_section`、`clear_outline`、`revise_outline`

**创作子图**：

1. `resolve-content-spec` — 补齐 `profile.content_format` / `media_modality`
2. `creativeDirector` — 读取当前 outline，生成内部 `Work.plan`（不对用户展示）
3. `conditional-edges/route-by-modality` — 路由到 llmCall 出稿环
4. `llmCall` ⇄ `tools` — `add_plan_task`、`spawn_specialist`、`generate_draft`、`complete_execution`、`revise_production_plan`

各媒介管线经 `route-by-modality` 汇入同一 `llmCall` 环；体裁约束由 `llm-call.prompt-format.ts` 与 state 注入。

## 内容规格（两层维度）

| 字段 | 含义 | 示例 |
|------|------|------|
| `content_format` | 体裁 | note、article、novel、video_script |
| `media_modality` | 媒介形式 | text、image、audio、video、mixed |

与 API `discover-taxonomy` 及发布 `Publication.contentFormat` / `mediaType` 枚举对齐。

## 模型分工

| 场景 | 实现位置 | 模型 |
|------|----------|------|
| 灵感 / 创作对话与工具 | `llm/dashscope.ts` | qwen3.7-max |
| 灵感可点击建议 | `nodes/update-brief-suggestions/after-inspiration-turn.ts` | deepseek-v4-pro（结构化，对齐灵感正文方案） |
| 大纲 agent | `nodes/update-outline/logic.ts` | deepseek-v4-pro（结构化） |
| 图像生成 | `llm/dashscope-image.ts` → `generateImage()` | qwen-image-2.0-pro |

## 与 API 的协作

- API 在 `Work` 表保存 `profile`、`brief`、`outline`、`plan`（内部）、`draft`；完整历史在 `WorkRevision` 单线时间轴
- 前端经 `/langgraph` 代理发起 run，请求头携带 `X-Work-Id`、`X-Conversation-Id`
- run 前 API 注入作品状态；stream 结束后 `applyAgentRunToWork` 写 revision 并物化 `Work` 列
- 平行探索（换平台/选题）：`POST /api/works/:id/duplicate` 另存为新作品
- Agent checkpoint 仅存对话与图状态，不替代 API 侧的作品持久化
- 发布时 API 优先使用 profile 中的 `content_format` / `media_modality` 作为分类来源

详见 [docs/technical/revision-graph.md](../../docs/technical/revision-graph.md)。

修改 `state.ts` 或 graph 拓扑后，需重启 `pnpm dev:agent`；已有 thread 的 checkpoint 可能需新 thread 或清库调试。

## 阅读代码建议

建议按下列顺序阅读（各模块顶部常有注释）：

1. **`schema.ts`** / **`@yougan/domain`** — `WorkBrief` / `WorkOutline`（用户可见）/ `WorkProductionPlan`（内部）/ `WorkDraft`
2. **`lib/content-spec.ts`** — 体裁/形式枚举与创作 pipeline 路由
3. **`state.ts`** — 字段与 reducer（`brief`、`outline`、`plan`、`draft`、`openingBriefSuggestions`、`briefSuggestions`）
4. **`graph.ts`** + **`conditional-edges/route-by-turn-task.ts`** — 主图任务队列路由
5. **`nodes/creation/graph.ts`** + **`conditional-edges/route-by-modality.ts`** — 创作复合 node
6. **`nodes/inspiration/nodes/llm-call.ts`** / **`nodes/tools.ts`** — LLM ⇄ Tool 环
7. **`nodes/creation/nodes/llm-call.ts`** + **`conditional-edges/after-llm.ts`** — 出稿环
8. **`tools/content-spec.ts`** — `confirm_content_spec` 工具
9. **`lib/structured-output.ts`** — 结构化流式封装

## 技术栈

- LangGraph JS 1.x（`@langchain/langgraph` + `@langchain/langgraph-cli`）
- `@langchain/langgraph-checkpoint-postgres`（Postgres checkpoint）
- `@langchain/core` 1.x、`@langchain/anthropic` 1.x（兼容 MiniMax / DeepSeek 端点）
- Zod、`langchain` 1.x tools

## 相关文档

- [根目录 README](../../README.md)
- [apps/api/README.md](../api/README.md) — LangGraph 代理与 `X-Work-Id`
- [apps/web/README.md](../web/README.md) — `useStream` 前端集成
- [content-taxonomy.md](../../docs/business/content-taxonomy.md) — 分类体系与 Agent 协作
- [creation-methodology.md](../../docs/business/creation-methodology.md) — 三模式创作模型
- [revision-graph.md](../../docs/technical/revision-graph.md) — 单线版本与另存为新作品
