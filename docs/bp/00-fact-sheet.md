# 00 · 事实底稿（Fact Sheet）

本文件汇总**可核验事实**，全部来自当前代码与配置（校准日期 2026-06）。BP 正文中的产品、定价、平台、模型等数字应以此为准。

---

## 1. 品牌与定位

| 项 | 值 | 来源 |
|----|----|------|
| 产品名 | 有感 · Yougan | `site-copy.ts` `BRAND` |
| 英文名 | Yougan | 同上 |
| 落地页主张 | AI 创作助手 | `BRAND.taglineLanding` |
| 应用内主张 | 方案 · 制作 · 提问 | `BRAND.taglineApp` |
| Meta 描述 | 先定制作方案，再由 AI 团队按计划制作文字、画面、音视频等作品，全程可确认、可修改、可回溯 | `BRAND.metaDescription` |
| 核心理念 | 方案先于制作；你确认，AI 执行；环节边界清晰 | `ABOUT_PAGE.values` |

---

## 2. 创作方法论（环节）【已核验】

三个对话环节 + 一个素材环节，同一件作品内可随时切换；每条消息由「回合队列」自动路由。

| 环节 | 代码内部名 | 职责 | 不做 |
|------|-----------|------|------|
| 定方案 | `profile` | 整理主题、体裁、表达、结构、规则 | 不直接产出作品内容、不执行制作 |
| 备参考 | `reference` | 上传/分析参考素材（文/图/音/视频） | — |
| 制作 | `production` | AI 团队排计划并按方案执行出稿 | 不跳过任务记录直接生成 |
| 提问 | `ask` | 优化、学习、背景答疑 | 不直接产出作品、不排制作计划 |

来源：`product-capabilities.ts`（`STUDIO_CAPABILITIES`）、`docs/technical/agent-turn-queue.md`。

### 支持的创作形态（8 种）【已核验】

观点长文、清单笔记、案例故事、教程干货、对比评测、脚本口播、**插画绘画**、**短视频脚本**。
来源：`product-capabilities.ts` `PRODUCTION_FORMS`。

> 含视觉形态：设计任务可直接「文生图」，详见 `docs/technical/design-image-generation.md`。

---

## 3. 套餐与定价【已核验 · 与旧文档不同】

来源：`apps/api/src/lib/subscription-plans.ts`。计量单位为 **microCredits**（`1 microCredit = ¥0.0001`，即 `¥1 = 10,000 microCredits`），代表本周期可消耗的 **API 成本预算上限**，非固定「次数」。

| 套餐 | id | 月价 | 年价 | 月度预算额度 | 折算预算 | 标记 |
|------|----|------|------|--------------|----------|------|
| 免费版 | `free` | ¥0 | ¥0 | 800,000 mc | ¥80/月 | — |
| Pro | `pro` | ¥68 | ¥678 | 2,550,000 mc | ¥255/月 | — |
| Pro+ | `pro_plus` | ¥128 | ¥1278 | 5,200,000 mc | ¥520/月 | 推荐（highlighted） |

- 年付折算：Pro ≈ ¥56.5/月、Pro+ ≈ ¥106.5/月（约 8.3 折）。
- 旧 planId 兼容：`creator → pro`（`LEGACY_PLAN_ALIASES`）。
- 套餐权益文案：免费「全流程 + 分组 + 云端同步」；Pro「更高额度 + 旗舰出稿 + 平台一键发布」；Pro+「充足额度 + 旗舰全场景 + 优先响应 + 平台发布」。
- 用户侧展示为「本月 AI 创作额度」百分比进度，超额提示升级或下月重置（`site-copy.ts` `MEMBERSHIP`）。

> **重要业务含义**：额度是「成本上限」而非「预期用量」。Pro 付 ¥68 可消耗最多 ¥255 的 API 成本——毛利取决于**实际用量远低于上限**。BP 的单位经济须按真实人均消耗建模，不能按预算上限。

---

## 4. AI 计量与模型成本【已核验】

来源：`packages/domain/src/utils/ai-metering/pricing.ts`（"与百炼/DeepSeek/MiniMax 官方价对齐 2026 Q1"）。

| 计量模型 | 输入（元/百万 token） | 输出（元/百万 token） | 缓存输入 | 备注 |
|----------|----------------------|----------------------|----------|------|
| qwen-max | ¥2.4 | ¥9.6 | — | 主对话 |
| qwen-plus | ¥0.8 | ¥2.0 | — | 轻量 |
| deepseek-v3 | ¥2.0 | ¥8.0 | ¥0.5 | 结构化 |
| minimax-m3-s | ¥2.1 | ¥8.4 | ¥0.42 | 多模态 |

计量与结算：每次 LLM 调用按 token 用量换算 microCredits（`computeMicroCreditsFromUsage`），缓存命中按缓存价。结算写入 `AiUsageSettlement`（带幂等键），累加到 `UserSubscription.aiUsageMicroCredits`。

---

## 5. 实际模型目录【已核验】

来源：`apps/agent/src/llm/providers/catalog.ts`、`apps/agent/src/env.ts`。LLM 统一走阿里百炼 DashScope（OpenAI 兼容端点）+ MiniMax。

| 用途 | 模型 | 上下文 |
|------|------|--------|
| 主对话（profile / production / ask） | Qwen `qwen3.7-max-2026-06-08` | 990K |
| 多模态对话（reference 分析） | MiniMax `MiniMax-M3` | 1M |
| 文生图（设计任务） | MiniMax `image-01` | — |
| 文生图（百炼原生备选） | DashScope `qwen-image-2.0-pro` | — |
| 语音识别 | DashScope `fun-asr` | — |

> 计量表里的 `deepseek-v3`、`qwen-plus` 为成本对齐用的价位桶；实际对话主模型为上表所列。

---

## 6. 发布渠道【已核验】

- 创作台成稿可 **发布到有感** 公域（发现灵感、个人主页），已实现。
- 暂不支持绑定或一键发布到第三方平台（小红书、公众号等）。

---

## 7. 核心数据模型【已核验】

来源：`apps/api/prisma/schema.prisma`。

| 模型 | 关键字段 | 说明 |
|------|----------|------|
| `User` | email、passwordHash、name、bio、avatarUrl、coverUrl | 账号与作者主页资料 |
| `UserSubscription` | planId、status、billingCycle、currentPeriodEnd、`aiUsageMicroCredits`、cancelAtPeriodEnd | 订阅与本周期用量 |
| `AiUsageSettlement` | idempotencyKey、microCredits | 幂等计量流水 |
| `BillingOrder` | planId、billingCycle、amountCents、status（pending/paid/failed/refunded）、paidAt | 账单订单 |
| `Work` | profile / references / production（均为 JSON 物化视图）、headVersionId、sourceWorkId | 作品聚合根 |
| `WorkVersion` | parentVersionId、kind、summary、snapshot | 单线版本时间轴 |
| `WorkConversation` | threadId | 多轮对话，绑定 LangGraph checkpoint |
| `Publication` | slug、contentFormat/topicCategory/contentTopic/contentType、mediaTypes、viewCount、status | 公域发布与分类 |

---

## 8. 功能实现状态【已核验】

状态：**已实现** | **部分实现（需配置）** | **待接入**

| 模块 | 能力 | 状态 |
|------|------|------|
| 账号 | 注册登录、JWT、找回/改密、改邮箱、资料、头像/封面 | 已实现 |
| 创作台 | 作品 CRUD、分组、回合队列对话、侧栏直改、作品面板四 Tab、流式、创意度滑杆(0.1–1.0) | 已实现 |
| AI | 定方案五步工具、参考多模态分析、按计划出稿与修改、文生图、执行摘要、会话持久化 | 已实现 |
| 内容社区 | 发现灵感列表/详情、个人主页、发布管理、发布分类确认（AI 推断标签） | 已实现 |
| 文生图 | MiniMax image-01 出图 → API 物化到自有存储（OSS/local）→ 前端图册 | 已实现 |
| 会员计费 | 三档套餐、额度展示与用尽提示、订单列表、退款、取消续费 | 已实现（**模拟支付**） |
| 真实支付通道 | 微信/支付宝在线收款 | **待接入**（文案标明「当前为模拟支付」） |
| 手机 App | 记灵感 + 与 Web 同步 | 规划中（介绍页已上线，下载链接待配置） |

来源：`docs/business/feature-catalog.md`（功能项）+ 代码现状修订。

---

## 9. 技术架构【已核验】

```text
浏览器 (apps/web :3000，Vite + React 19)
  ↓ REST / OpenAPI（携 JWT + X-Work-Id）
中间层 (apps/api :4000，Express 5 + Prisma) — 鉴权、作品、发布、订阅、上传、LangGraph 代理
  ├─→ Postgres API (:5432) — 用户/作品/发布/订阅
  ├─→ Redis (:6379) — 可选缓存
  └─→ Agent (apps/agent :2024，LangGraph JS) — 回合队列 → reference/profile/production/ask 子图
        └─→ Postgres Agent (:5433) — LangGraph checkpoint
```

- Monorepo：pnpm workspace + Turborepo。
- 业务库与 AI 状态库分离；OpenAPI 驱动前后端契约（便于后续 API 开放 / 白标）。
- 存储：本地目录或阿里云 OSS（`STORAGE_DRIVER`）。

---

## 10. 与旧文档（`docs/business/`）的差异

| 项 | 旧文档（business） | 现行代码（本底稿） |
|----|--------------------|--------------------|
| 套餐档位 | 两档（免费 / Pro） | **三档（free / pro / pro_plus）** |
| 计费单位 | 「次」（30 / 500 次/月） | **microCredits（API 成本预算上限）** |
| Pro 价格 | ¥29/月、¥288/年 | **¥68/月、¥678/年** |
| Pro+ | 无 | **¥128/月、¥1278/年（推荐档）** |
| 平台数量 | 6 个 | **9 个**（含 Twitter/LinkedIn/Instagram） |
| 文生图 | 未突出 | **已实现**（MiniMax image-01 + 物化落库 + 图册） |
| 主对话模型 | qwen3.7-max（口径一致） | `qwen3.7-max-2026-06-08`；多模态 `MiniMax-M3` |

> 撰写 BP 时若引用 `docs/business/`，凡涉上述项一律以本底稿覆盖。
