# production 子图

每次进入子图会**重置** `staging.production`，再排计划、按任务管线产出与验收，最终写入 `preview` 或向用户说明失败原因。

## 拓扑

```text
START → planProduction → dispatchTask
                              ├─ executeWriting / executeDesign → acceptTask → routeProduction
                              ├─ routeProduction（待验收 / 全部 ready 等）
                              └─ summarizeProduction（计划为空）
dispatchTask（待验收时也可直达 acceptTask，避免 dispatch ↔ route 空转）
routeProduction
  ├─ dispatchTask（继续下一任务或重试）
  ├─ assemblePreview（全部 ready）→ summarizeProduction
  └─ summarizeProduction（验收 3 次失败）
summarizeProduction → END
```

## 节点职责

| 节点                               | 类型     | 职责                                                  |
| ---------------------------------- | -------- | ----------------------------------------------------- |
| `planProduction`                   | llm-work | 重置 production，LLM 生成 `pending_tasks` + `summary` |
| `dispatchTask`                     | plain    | 标记当前 `in_progress` 任务                           |
| `executeWriting` / `executeDesign` | llm-work | 单任务产出 → `deliverable`                            |
| `acceptTask`                       | llm-work | 方向性验收；失败重试或标 `failed`                     |
| `routeProduction`                  | plain    | 流转锚点（无状态变更）                                |
| `assemblePreview`                  | llm-work | 整合片段 → `preview`，清空 `pending_tasks`            |
| `summarizeProduction`              | plain    | 对话末位摘要（成稿 / 失败 / 空计划）                  |

## helpers（跨节点复用）

| 文件                                                | 用途                                          |
| --------------------------------------------------- | --------------------------------------------- |
| `task-plan.ts`                                      | 任务状态判断、dispatch 路由、`withActiveTask` |
| `pipeline.ts`                                       | `MAX_ACCEPT_ATTEMPTS`（验收上限）             |
| `produce-task.ts`                                   | 执行者产出 LLM 调用                           |
| `produce-task-prompt.ts` / `produce-task-schema.ts` | 产出 prompt 与 schema                         |
| `run-executor.ts`                                   | `execute*` 节点入口                           |
| `deliverable.ts`                                    | 交付物校验                                    |
| `summarize-outcome.ts`                              | 总结节点文案                                  |
| `department-brief.ts`                               | 计划 fallback 部门说明                        |
| `format-guidance.ts` / `word-count-guidance.ts`     | 体裁与篇幅提示                                |

## 任务状态

`pending` → `in_progress` → `ready`；验收连续失败达上限 → `failed`（带 `failure_message`）。

`accept_retry_count` 在每次验收失败时递增；通过验收时清零。
