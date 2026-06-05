# @yougan/agent 代码组织

LangGraph 主创作流。`src/graph.ts` 为唯一接线入口（langgraph.json）；子图在各自 `graph.ts` 显式接线，LLM 环用 `ToolNode` + `toolsCondition`（`@langchain/langgraph/prebuilt`）。

## state-graph 递归模板

```text
src/
├── graph.ts              # 唯一 StateGraph 接线（含子图 compile import）
└── state-graph/
    ├── nodes/
    ├── conditional-edges/
    └── subgraphs/
        ├── profile/
        │   ├── graph.ts
        │   ├── nodes/
        │   ├── conditional-edges/
        │   └── helpers/
        ├── production/
        └── ask/
```

主图接线在 `src/graph.ts`；各子图接线在 `state-graph/subgraphs/<name>/graph.ts`。

**目录命名**：`nodes/`、`conditional-edges/` 下文件夹统一用 kebab-case（如 `llm-call`、`ensure-profile`）；LangGraph 节点 ID 仍可用 camelCase 字符串。

## graphNode kind

| kind | 目录内容 |
|------|----------|
| **plain** | `node.ts` |
| **llm-chat** | `node.ts` + `prompt.ts` |
| **llm-work** | `node.ts` + `prompt.ts`（+ `schema.ts`） |
| **tool-node** | `node.ts` + `tools/` |
| **subgraph** | `subgraphs/<name>/graph.ts` compile → 主图 addNode |

## 路径别名

| 别名 | 指向 |
|------|------|
| `#agent/runtime/*` | `src/runtime/*` |
| `#agent/model/*` | `src/model/*` |
| `#agent/llm/*` | `src/llm/*` |
| `#agent/messages/*` | `src/messages/*` |
| `#agent/system-prompt.js` | `src/system-prompt.ts` |
| `#agent/state.js` | `src/state.ts` |
| `#agent/env.js` | `src/env.ts` |
