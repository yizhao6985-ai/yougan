# @yougan/agent

Node.js LangGraph 服务：**回合队列** workflow + 对话子图（profile / production / ask / revise / collectRevision）。当前为纯文本对话与文案生成主流程。

由 `@langchain/langgraph-cli` 在开发模式启动，默认 `http://localhost:2024`。生产环境由 `apps/api` 的 `/langgraph` 代理访问。

## Graph 注册

| Graph ID | 入口 | 用途 |
|----------|------|------|
| `yougan` | `src/graph.ts:graph` | 主创作流 |

Checkpoint：与 API 共用 Postgres（`POSTGRES_URI`）。

## 主图流程

```text
START → planTurnQueue → dispatchTurnQueue → [*Graph] → advanceTurnQueue
  → generateTurnDirections → commitTurn → summarizeMessages → finalizeRunMetering → END
```

| TurnQueueKind | 子图 | 说明 |
|---------------|------|------|
| `profile` | `profileGraph` | 改作品方案 |
| `production` | `productionGraph` | 制作计划 + 文本出稿 + 质检 |
| `collectRevision` | `collectRevisionGraph` | 收集局部改稿意见 |
| `revise` | `reviseGraph` | 在现有成稿上执行改稿 |
| `ask` | `askGraph` | 答疑 |

`production` 仅 `executeWriting` 文本路径（无出图 / 无音频入库 / 无参考素材子图）。

详见 [docs/technical/agent-turn-queue.md](../../docs/technical/agent-turn-queue.md) 与 [AGENTS.md](./AGENTS.md)。

## LLM 接入

统一走 OpenAI 兼容端点。环境变量：`OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_CHAT_MODEL`。

| 场景 | 工厂 | 调用 |
|------|------|------|
| 对话子图 | `createChatModel` | `streamChat` |
| 结构化 work | `createChatModel` / `createProductionChatModel` | `invokeStructured` |
