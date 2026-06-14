# production 子图

每次进入子图会**重置** `staging.production`，再排计划、按任务管线产出与验收，最终写入 `preview` 或向用户说明失败原因。

## 拓扑

```text
START → planProduction → dispatchTask
                              ├─ executeWriting / executeDesign → acceptTask → routeProduction
                              └─ summarizeProduction（计划为空 / 无法执行）
routeProduction
  ├─ dispatchTask（尚有未完成任务）
  ├─ assemblePreview（全部 ready）→ summarizeProduction
  └─ summarizeProduction（失败 / 卡住；跳过整合）
summarizeProduction → END
```

## 节点职责

| 节点                               | 类型     | 职责                                                  |
| ---------------------------------- | -------- | ----------------------------------------------------- |
| `planProduction`                   | llm-work | 写入用户要求（summary），生成可执行 `pending_tasks` |
| `dispatchTask`                     | plain    | 标记当前 `in_progress` 任务                           |
| `executeWriting` / `executeDesign` | llm-work | 单任务产出 → `deliverable`                            |
| `acceptTask`                       | llm-work | 方向性验收；失败重试或标 `failed`                     |
| `routeProduction`                  | plain    | 流转锚点（无状态变更）                                |
| `assemblePreview`                  | llm-work | 整合片段 → `preview`，清空 `pending_tasks`            |
| `summarizeProduction`              | plain    | 对话末位摘要（成稿 / 失败 / 空计划）                  |

## LLM 调用约定

内部 work 节点统一 **SystemMessage（稳定规则层）+ HumanMessage（总监工单层）**，不传对话 `messages`。

| 节点 | prompt 位置 |
| ---- | ----------- |
| `planProduction` | `nodes/plan-production/prompt.ts` |
| `executeWriting` / `executeDesign` | `nodes/execute-writing/prompt.ts`（共享） |
| `acceptTask` | `nodes/accept-task/prompt.ts` |
| `assemblePreview` | `nodes/assemble-preview/prompt.ts` |

## helpers（跨节点复用）

| 文件                                            | 用途                                          |
| ----------------------------------------------- | --------------------------------------------- |
| `task-plan.ts`                                  | 任务状态判断、dispatch 路由、`withActiveTask` |
| `pipeline.ts`                                   | `MAX_ACCEPT_ATTEMPTS`（验收上限）             |
| `format-guidance.ts` / `word-count-guidance.ts` | 体裁与篇幅提示                                |
| `resolve-production-max-tokens.ts`              | 制作 LLM 输出 token 上限                      |
| `progress-labels.ts`                            | 运行进度文案                                  |

## 任务状态

`pending` → `in_progress` → `ready`；验收连续失败达上限 → `failed`（带 `failure_message`）。

`accept_retry_count` 在每次验收失败时递增；通过验收时清零。
