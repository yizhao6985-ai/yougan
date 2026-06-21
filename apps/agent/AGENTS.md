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
        ├── reference/
        │   ├── graph.ts
        │   ├── nodes/
        │   └── conditional-edges/
        ├── profile/
        │   ├── graph.ts
        │   ├── nodes/
        │   └── conditional-edges/
        ├── production/          # 见 subgraphs/production/README.md；根下 helpers/ 为跨节点复用
        ├── ask/
        └── suggestions/
```

系统收尾节点（`post-commit/`：对话标题；`summarize-messages/`：对话过长滚动摘要）在 `commitTurn` 之后接线；用户向任务走 turn 子图；`nextStepSuggestions` 在 `commitTurn` 后由 `suggestionsGraph` 生成。

主图接线在 `src/graph.ts`；各子图接线在 `state-graph/subgraphs/<name>/graph.ts`。

**目录命名**：`nodes/`、`conditional-edges/` 下文件夹统一用 kebab-case（如 `mutate-profile`、`after-plan-production`）。

**图节点 ID**：`addNode` / `addEdge` / 条件边路由目标统一用 **camelCase**（如 `mutateProfile`、`runProfileTools`、`generateSuggestions`），与目录名 kebab-case 区分。节点名按**功能**命名，避免 `llmCall` 等模糊词。

**条件边命名**：`conditional-edges/` 文件按**执行位置**命名（如 `at-graph-start`、`after-dispatch-turn-queue`、`after-mutate-profile`）；路由函数用 `selectAt*` / `selectAfter*`。

## graphNode kind

| kind | 目录内容 |
|------|----------|
| **plain** | `node.ts` |
| **llm-chat** | `node.ts` + `prompt.ts` |
| **llm-work** | `node.ts` + `prompt.ts`（+ `schema.ts` + `helpers/`） |
| **run-tools** | `node.ts` + `tools/`（tool 专属逻辑放 `tools/helpers/`） |
| **subgraph** | `subgraphs/<name>/graph.ts` compile → 主图 addNode |

节点内辅助逻辑放在该节点目录下的 `helpers/`（与 `prompt.ts` 同级），由 `node.ts` 或同目录 `prompt.ts` import。`run-*-tools/` 下仅 tool 使用的逻辑放 `tools/helpers/`（与 `tools/*.ts` 同级）。跨节点复用时从**归属节点**的 `helpers/` 相对路径引用（如 `run-preprocess-tools/tools/helpers/prepare/prepare-asset.js`），**不在**子图根下建 `helpers/`。

**与 `@yougan/domain` 的边界**：仅 agent 使用、web/api 用不上的工具函数不放 domain `utils/`；归到对应 node 的 `helpers/`。跨多节点共用的 LLM prompt 格式化放 `src/prompts/`（`#agent/prompts/*`）。domain 保留类型/常量及 web、api、agent 共享的解析与 merge。

## Agent state I/O（`src/state-io/`）

扁平函数，无 `read`/`write` 对象。节点 `return` patch；同节点多字段用 `patchPendingBatch`。

| 模块 | 函数 | 用途 |
|------|------|------|
| `get.ts` | `getProfile`、`getProduction`、`getPreview`… | 作品字段 **staging 优先** |
| `get.ts` | `getProduction` | staging.production（任务 `in_progress` 表示当前执行） |
| `get.ts` | `getTurnQueue`、`getActiveTurnKind`… | 控制字段，读 `turn` |
| `turn.ts` | `getTurn`、`patchTurn` | 回合运行时读写 |
| `patch-pending.ts` | `patchPendingProfile`、`patchPendingProductionFields`… | 写 staging |
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
| `llm/providers/` | **创建**客户端：`createChatModel`、`createMultimodalChatModel`（百炼）、`generateDesignImage`（百炼文生图） |
| `llm/invoke/` | **调用**：`streamChat`（对话）、`invokeStructured`（文本结构化 work）、`invokeMultimodalStructured`（多模态结构化，保留 image_url） |

```typescript
import { createChatModel, createMultimodalChatModel } from "#agent/llm/providers/index.js";
import { streamChat, invokeStructured, invokeMultimodalStructured } from "#agent/llm/invoke/index.js";

const llm = createChatModel({ temperature: 0.7 });
const message = await streamChat(llm.bindTools(tools), input, config);
const decision = await invokeStructured(llm, schema, input, { name: "..." }, config);
const analysis = await invokeMultimodalStructured(
  createMultimodalChatModel(),
  schema,
  multimodalInput,
  { name: "..." },
);
```

节点内禁止直接 `llm.invoke()`，统一走 `llm/invoke/`。结构化调用会合并 `nostream` tag，避免内部输出泄漏到前端；有 `RunnableConfig` 的节点应传入。

## 路径别名

| 别名 | 指向 |
|------|------|
| `#agent/state-io/*` | `src/state-io/*` |
| `#agent/llm/*` | `src/llm/*` |
| `#agent/messages/*` | `src/messages/*` |
| `#agent/system-prompt.js` | `src/system-prompt.ts` |
| `#agent/state.js` | `src/state.ts` |
| `#agent/env.js` | `src/env.ts` |
