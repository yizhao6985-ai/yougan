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
        │   └── conditional-edges/
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
| **llm-work** | `node.ts` + `prompt.ts`（+ `schema.ts` + `helpers/`） |
| **tool-node** | `node.ts` + `tools/` |
| **subgraph** | `subgraphs/<name>/graph.ts` compile → 主图 addNode |

节点内辅助逻辑放在该节点目录下的 `helpers/`（与 `prompt.ts` 同级），由 `node.ts` 或同目录 `prompt.ts` import。跨节点复用时从所属节点的 `helpers/` 相对路径引用（如 `../spawn-specialist/helpers/department-brief.js`），**不在**子图根下建 `helpers/`。

## Agent state I/O（`src/state-io/`）

扁平函数，无 `read`/`write` 对象。节点 `return` patch；同节点多字段用 `patchPendingBatch`。

| 模块 | 函数 | 用途 |
|------|------|------|
| `get.ts` | `getProfile`、`getProductionPlan`、`getPreview`… | 作品字段 **staging 优先** |
| `get.ts` | `getProfileStagingMeta`、`getProductionStagingMeta` | staging.meta（含默认值） |
| `get.ts` | `getTurnQueue`、`getActiveTurnKind`… | 控制字段，读 state 顶层 |
| `patch-pending.ts` | `patchPendingProfile`、`patchPendingProductionMeta`… | 写 staging |
| `patch-pending.ts` | `patchPendingBatch` | 合并多个 `{ staging }` patch |
| `lifecycle.ts` | `initPendingTurn`、`requirePending`、`commitPending`、`rollbackPending` | 回合工作区 |
| `index.ts` | `getState`（`getCurrentTaskInput` 重导出） | LangGraph tool 内读 state |

Tool 返回 `Command` 不在 state-io，各 tool 内直接 `new Command` + `ToolMessage`：

```typescript
import { ToolMessage } from "@langchain/core/messages";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { getProfile, getState, patchPendingProfile } from "#agent/state-io/index.js";

const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
return new Command({
  update: {
    messages: [new ToolMessage({ content: "已更新。", tool_call_id: toolCallId })],
    ...patchPendingProfile(state, next),
  },
});
```

## LLM（`src/llm/`）

统一挂在 `llm/` 下，按职责分子目录，避免 `model` 与 `domain` 模型概念混淆。

| 子目录 | 职责 |
|--------|------|
| `llm/providers/` | **创建**客户端：`catalog`、`createChatModel`、`generateImage`（文本统一 qwen3.7-max） |
| `llm/invoke/` | **调用**：`streamChat`（对话）、`invokeStructured`（后台 work） |

```typescript
import { createChatModel } from "#agent/llm/providers/index.js";
import { streamChat } from "#agent/llm/invoke/index.js";

const llm = createChatModel({ temperature: 0.7 });
const message = await streamChat(llm.bindTools(tools), input, config);
```

节点内禁止直接 `llm.invoke()`，统一走 `llm/invoke/`。

## 路径别名

| 别名 | 指向 |
|------|------|
| `#agent/state-io/*` | `src/state-io/*` |
| `#agent/llm/*` | `src/llm/*` |
| `#agent/messages/*` | `src/messages/*` |
| `#agent/system-prompt.js` | `src/system-prompt.ts` |
| `#agent/state.js` | `src/state.ts` |
| `#agent/env.js` | `src/env.ts` |
