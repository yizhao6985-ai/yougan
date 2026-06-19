# 设计任务文生图（端到端）

设计（`department=design`）任务从「写 prompt」到「成图入库、前端展示」的完整链路。涉及 `apps/agent`（生成）、`apps/api`（物化与落库）、`apps/web`（展示）、`packages/domain`（共享类型与画幅推断）。

## 总览

```text
profile.direction.format ──▶ resolveContentFormFromProfile ──▶ resolveImageAspectRatio（画幅）
                        │
agent: production 子图   ▼
  planProduction ──▶ dispatchTask ──▶ executeDesign（写 prompt）
                                        ▼
                                   renderDesignImage（MiniMax image-01 出图 → 临时 URL, transient:true）
                                        ▼
                                   acceptTask（方向性验收）──▶ assemblePreview（写入 preview.images）
                                        ▼
                                   summarizeProduction ──▶ END
                        │
api: 落库前              ▼
  applyAgentRunToWork ──▶ materializeAgentRunValues
                            └─ 拉取临时 URL → 上传自有 storage（OSS/local）→ 替换为稳定 URL、剥离 transient
                        │
web: 展示                ▼
  content-preview / publication-article ──▶ WorkPreviewImages + WorkPreviewImageGallery
```

核心约定：**Agent 只产出临时外链**（MiniMax 返回的 URL 有时效），**API 在写库前把图片物化到自有存储**，前端始终读自有存储的稳定 URL。

## 一、画幅推断（domain）

出图比例统一由作品方案（`profile.direction.format` 与节拍推断的媒介）推断，保证文案与配图画幅一致。

- `packages/domain/src/utils/aspect-ratio.ts`
  - `DESIGN_IMAGE_ASPECT_RATIOS`：image-01 支持的 8 种比例（`1:1 / 16:9 / 4:3 / 3:2 / 2:3 / 3:4 / 9:16 / 21:9`）。
  - `aspectRatioFromParams`：从运行时推断的 `mediaParams.image.aspect_ratio` 读显式画幅。
  - `normalizeProfileAspectRatio`：已是合法比例 id 则原样保留；中文描述（如「手机截图」→ `9:16`、「封面/横屏」→ `16:9`、「方图」→ `1:1`）才映射。
  - `inferProfileAspectRatio`：无显式 params 时按平台（抖音/快手 `9:16`、小红书 `3:4` 等）与体裁（`illustration/note` `3:4`、`short_video` `9:16` 等）推断，兜底 `1:1`。
- `packages/domain/src/utils/image-aspect-ratio.ts`
  - `resolveImageAspectRatio(profile)`：对外统一入口。显式 media params 优先；否则仅当作品需要图像（含 `image` 媒介或 `illustration/short_video/video_script` 体裁）时按 format/节拍推断，其余兜底 `1:1`。

Agent 侧通过薄封装 `apps/agent/.../production/helpers/image-aspect-ratio.ts` 复用同一函数。

## 二、生成链路（agent / production 子图）

子图拓扑见 `apps/agent/src/state-graph/subgraphs/production/README.md`。设计任务固定走三步，**不可跳过 executeDesign**：

### 1. 路由：`conditional-edges/after-dispatch-task.ts`

`dispatchTask` 后，若当前任务 `isDesignTask` 且 `taskNeedsProduce || taskNeedsRender`，一律路由到 `executeDesign`（即便已有 prompt、只差出图，也先经 `executeDesign` no-op，再由静态边进 `renderDesignImage`）。

图接线（`graph.ts`）：

```text
executeDesign → renderDesignImage → acceptTask → routeProduction
```

### 2. `executeDesign`（LLM，结构化）

- `nodes/execute-design/node.ts` → `helpers/produce-design-task.ts`
- 用 `createProductionChatModel` + `invokeStructured`，按 `schema.ts`（`DesignDeliverablePayloadSchema`）产出：
  - `body`：可直接喂给 image-01 的文生图 prompt（主体/构图/风格/光线/色彩，可中英混写）。
  - `notes`：1–3 句中文短说明，整合阶段写入 `preview.body`。
  - `title`（可选）、`negative_prompt`（可选）。
- prompt 见 `nodes/execute-design/prompt.ts`：system 注入 profile 摘要、体裁/媒介要求、画幅、创作规则（`scope=all|visual`）；human 注入任务描述、总监方向、验收标准、质检 feedback。
- 结果写入 `task.deliverable`，并将 `images` 置空、`render_error` 清空，任务标 `in_progress`。LLM 调用异常时写入兜底 prompt 与失败说明。

### 3. `renderDesignImage`（plain，调外部 API）

- `nodes/render-design-image/node.ts`
- 仅处理 `department=design` 且 `deliverable.body` 非空、且尚无成图的任务。
- `buildImageGenerationPrompt` 在 prompt 后追加构图约束（满幅、无 letterbox/黑边）、`notes`、`negative_prompt`。
- 调 `generateMiniMaxImage`（`responseFormat: "url"`），最多重试 `MAX_RENDER_ATTEMPTS = 2` 次。
- 成功：写入 `deliverable.images = [{ url, alt, prompt, transient: true }]`，清空 `render_error`。
- 全部失败：`images` 置空、`render_error` 记最后错误信息（验收/总结时可读）。
- 全程用 `withRunProgressHeartbeat` + `patchRunProgress` 推送运行进度。

### 4. MiniMax image-01 客户端

- `apps/agent/src/llm/providers/minimax-image.ts`：`generateMiniMaxImage`
- 直接 `fetch` MiniMax `/v1/image_generation`，模型取 `env.minimaxImageModel`（默认 `image-01`）。
- 入参：`prompt`（截断 1500 字）、`aspect_ratio`（归一化到合法集合，兜底 `1:1`）、`response_format`、`n:1`、`prompt_optimizer:false`、`aigc_watermark:false`。
- 校验 `base_resp.status_code`，返回 `imageUrl` / `imageBase64` / `requestId`。缺 `MINIMAX_API_KEY` 抛 `MINIMAX_API_KEY_MISSING`。

### 5. 验收与整合

- `acceptTask`：与文案验收同理，**验 prompt 方向与质量**；成图 URL 仅作结构凭证。方向问题回 `executeDesign` 重写 prompt；仅出图失败可保留 prompt 重试 render。连续失败达上限标 `failed`。
- `assemblePreview`：把通过的设计片段整合进 `preview`——`notes` 进 `preview.body`、`images` 进 `preview.images`，并清空 `pending_tasks`。

## 三、物化与落库（api）

Agent 写入的是**临时外链**（`transient: true`）。落库前必须把图片转存到自有存储，避免外链失效。

- 入口：`apps/api/src/services/work-versions.ts` 的 `applyAgentRunToWork`，在 `snapshotFromAgentValues` 之前调用 `materializeAgentRunValues`。
- `apps/api/src/services/materialize-preview-images.ts`
  - `materializeAgentRunValues` → `materializeWorkProductionImages`：同时处理 `production.preview.images` 与每个 `task.deliverable.images`。
  - `imageNeedsMaterialize`：跳过已是自有存储的 URL（`/api/files/...` 或 OSS `bucket.host`，见 `isOurStorageUrl`）；`transient` 或 `http` 外链才物化。
  - `persistRemoteImage`：`fetch` 原图 → 由文件头/响应头判 content-type（jpeg/png/webp）→ `uploadFile(buffer, "generated", <nanoid>.<ext>, contentType)` → 返回稳定 URL。
  - 物化后剥离 `transient` 字段；单张失败仅记日志并保留原图，不阻断整体落库。
- 落库时 `committedProduction` 会剥离 task 上的 staging 草稿字段（`deliverable/feedback/...`），最终图片留在 `preview.images`。

### 存储驱动（api）

- `apps/api/src/services/storage.ts` 的 `uploadFile` 支持 `local` 与 `oss` 两种驱动；`generated` 为新增的上传分类（供物化图片使用）。
- `oss` 走阿里云 OSS（`ali-oss`，V4 签名、`public-read`），公网地址形如 `https://<bucket>.<endpoint-host>/<key>`。
- 环境变量（`apps/api/src/env.ts`）：`STORAGE_DRIVER`（`local|oss`）、`STORAGE_LOCAL_DIR`、`OSS_ENDPOINT / OSS_REGION / OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_SECRET_ACCESS_KEY`（driver=oss 时必填）。

## 四、展示（web）

- `apps/web/src/components/work-preview-images.tsx`：`WorkPreviewImages` 缩略图列表，`onError` 显示占位、点击打开图册。
- `apps/web/src/components/work-preview-image-gallery.tsx`：`WorkPreviewImageGallery` 全屏图册，支持左右切换、键盘 ←/→、打开原图、多图圆点导航。
- 渲染入口：`content-preview.tsx`（创作台预览）与 `content/publication-article.tsx`（发布详情）读取 `preview.images` 渲染。

## 五、类型与配置

| 位置 | 内容 |
|------|------|
| `packages/domain/src/models/work/preview.ts` | `WorkPreviewImage`（`url/alt/prompt/transient`）、`WorkPreview.images` |
| `packages/domain/src/models/work/production.ts` | `ProductionTaskDeliverable.images / render_error / negative_prompt`（均为 staging，commit 时剥离） |
| `apps/agent/src/env.ts` | `MINIMAX_API_KEY / MINIMAX_BASE_URL / MINIMAX_IMAGE_MODEL`（默认 `image-01`） |
| `apps/agent/src/llm/providers/catalog.ts` | `MINIMAX_IMAGE_MODELS`（`image-01`） |
| `apps/api/src/env.ts` | `STORAGE_DRIVER` 与 `OSS_*` |

## 关键不变式

- Agent 永远只写**临时外链**（`transient: true`），不写自有存储 URL。
- 图片落库**只发生在 API 物化阶段**；前端读到的都是自有存储的稳定 URL。
- 出图画幅来自 `resolveImageAspectRatio(profile)`，与体裁/平台/文案保持一致。
- 设计任务必经 `executeDesign`，`dispatch` 不直达 `renderDesignImage`。
