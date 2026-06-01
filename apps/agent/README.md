# @yougan/agent

Node.js LangGraph 服务，实现「有感」三阶段创作图：**灵感 → 大纲 → 创作**。

由 `@langchain/langgraph-cli` 在开发模式启动，默认 `http://localhost:2024`。生产环境由 `apps/api` 的 `/langgraph` 代理访问，不应对公网直接暴露（无 JWT 层）。

## Graph 注册

`langgraph.json` 中声明：

| Graph ID | 入口 | 用途 |
|----------|------|------|
| `yougan` | `src/graph.ts:graph` | 主创作流（按 `mode` 路由子图） |
| `inspiration-recommendations` | `src/graphs/inspiration-recommendations/graph.ts:graph` | 侧栏灵感推荐（独立调用） |

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

按 LangGraph 概念分层，每个 Graph（主图与子图）结构递归一致：

- **非子图的部分都进 `nodes/`**，每个节点用功能命名建一个文件夹，把该节点专属的 `prompt`、`tools`、`schema`、`logic` 等就近收纳；
- **有条件边时**，在 `nodes/` 同级建 `conditional-edges/`，每条边一个子文件夹，导出 `from`（源节点）、`router`（路由函数）、`paths`（目标映射）；
- 真正跨节点共享的才留在 Graph 顶层（主图的 `tools/`、`prompt/`、`schema.ts`、`lib/`）；
- 子图放在 `graphs/<功能名>/`，内部同样递归（不含 `lib/`，`lib/` 仅在最外层共享）。

```
src/
├── graph.ts                 # 主 Graph：mode → 子图路由（节点 id 用 *Graph）
├── checkpointer.ts          # Postgres checkpoint
├── state.ts                 # 主 Graph 状态（Annotation）
├── schema.ts                # 跨图共享类型、常量与工厂函数
├── env.ts
├── llm/                     # 模型工厂
├── prompt/                  # 跨子图共享提示词片段（system、context）
├── tools/                   # 跨子图共享 LangChain tools（mode、profile…）
├── lib/                     # 公共函数（compile-react-node…）
├── nodes/                   # 主 Graph 节点（每个一文件夹）
│   ├── clear-suggestions/
│   └── run-creation-graph/
└── graphs/                  # 功能子图
    ├── inspiration/
    │   ├── graph.ts
    │   ├── conditional-edges/
    │   │   └── react-tools/
    │   └── nodes/
    │       ├── prepare-turn/
    │       ├── react/                 # ReAct 节点：index + prompt + tools/
    │       └── generate-suggestions/  # index + logic + schema
    ├── ask/
    │   ├── graph.ts
    │   ├── conditional-edges/
    │   │   └── react-tools/
    │   └── nodes/{prepare-turn, react}/
    ├── creation/
    │   ├── graph.ts
    │   ├── conditional-edges/
    │   │   ├── route-by-modality/
    │   │   └── react-tools/
    │   └── nodes/
    │       ├── prepare-turn/
    │       ├── resolve-content-spec/
    │       ├── creative-director/     # index + logic + schema
    │       └── production/            # 出稿节点：index + prompt + prompt-format + schema + tools/
    └── inspiration-recommendations/   # 独立 state
        ├── graph.ts
        ├── state.ts
        └── nodes/recommend/           # index + prompt + schema
```

节点文件夹约定：`index.ts` 是节点本体（节点封装 / ReAct 编译结果）；较重的纯逻辑放 `logic.ts`；该节点专属的提示词放 `prompt.ts`、结构化 schema 放 `schema.ts`、工具放 `tools/`。ReAct 节点的 `index.ts` 调用 `lib/compile-react-node.ts` 中的 `compileReactNode`，并从同级 `conditional-edges/react-tools/` 传入条件边配置。

条件边文件夹约定：`from` 为源节点 id；自定义路由导出 `routeByX` 函数 + `paths` 对象；ReAct 环导出 `router`（`toolsCondition`）+ `paths(toolsNodeId)`。

## 创作流程

```text
灵感模式 ──确认需求/规格──► 切换大纲模式 ──同步/编辑大纲──► complete_outline
                                                      │
                                                      ▼
                              创作子图：resolveContentSpec → routeByModality
                                                      │
                                                      ▼
                                            complete_execution（更新已实现状态）
```

**灵感工具**：`confirm_requirement`、`confirm_content_spec`、`update_requirement`、`delete_requirement`、`clear_inspirations`。确认后即时写入侧栏状态。

**大纲**：进入大纲模式时可自动 `sync_outline_from_inspiration`（DeepSeek）；也可手动触发。`complete_outline` 定稿后进入创作。大纲 prompt 按 `content_format` 注入结构建议。

**创作子图**（`graphs/creation/graph.ts`）：

1. `resolve-content-spec` — 补齐 `profile.content_format` / `media_modality`
2. `creative-director` — 制定制作计划（结构化输出）
3. `conditional-edges/route-by-modality` — 路由到 text / image / audio / video 出稿节点
4. `production`（ReAct）执行 `generate_content` + `complete_execution`

当前 image/audio/video 出稿仍复用同一 `production` 节点，按体裁与形式注入不同写作约束；独立媒体生成上线后替换对应节点。

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
| 灵感可点击建议 | `graphs/inspiration/nodes/generate-suggestions/logic.ts` | deepseek-v4-pro（结构化） |
| 创意总监制作计划 | `graphs/creation/nodes/creative-director/logic.ts` | deepseek-v4-pro（结构化） |
| 灵感推荐 | `graphs/inspiration-recommendations/nodes/recommend/` | deepseek-v4-pro（结构化） |
| 图像生成 | `llm/dashscope-image.ts` → `generateImage()` | qwen-image-2.0-pro |

## 与 API 的协作

- API 在 `Work` 表保存 `threadId`、`mode` 及 `inspiration` / `outline` / `creation` JSON
- 前端经 `/langgraph` 代理发起 run；API 注入作品上下文供 tools 读取
- Agent checkpoint 仅存对话与图状态，不替代 API 侧的作品持久化
- 发布时 API 优先使用 profile 中的 `content_format` / `media_modality` 作为分类来源

修改 `state.ts` 或 graph 拓扑后，需重启 `pnpm dev:agent`；已有 thread 的 checkpoint 可能需新 thread 或清库调试。

## 阅读代码建议

建议按下列顺序阅读（各模块顶部常有注释）：

1. **`schema.ts`** — `WorkInspiration` / `WorkProductionPlan` / `GeneratedContent` 数据分工
2. **`lib/content-spec.ts`** — 体裁/形式枚举与创作 pipeline 路由
3. **`state.ts`** — 字段与 reducer（尤其 `inspiration` merge）
4. **`graph.ts`** — mode 路由到子图
5. **`graphs/creation/graph.ts`** + **`conditional-edges/route-by-modality/`** — 创作子图
6. **`graphs/inspiration/nodes/react/`** — ReAct 节点（prompt + tools）
7. **`graphs/creation/nodes/production/`** — 出稿节点（prompt + schema + tools）
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
- [creation-methodology.md](../../docs/business/creation-methodology.md) — 三步创作模型
