# 有感 · 文档中心

## 用户知识库（RAG）

面向终端用户的帮助文档，用于 RAG 检索、产品内问答或客服知识库：

→ **[docs/rag/](./rag/README.md)**

| 文档 | 内容 |
|------|------|
| [产品概览](./rag/01-product-overview.md) | 有感是什么、与通用 AI 的差异 |
| [快速上手](./rag/02-getting-started.md) | 注册、首件作品、推荐流程 |
| [创作台指南](./rag/03-studio-guide.md) | 布局、面板、侧栏与对话 |
| [定方案](./rag/04-planning-your-work.md) | 选题、受众、结构 |
| [制作与改稿](./rag/05-producing-content.md) | 出稿、修改、版本 |
| [参考素材](./rag/06-using-references.md) | 上传、借鉴意图 |
| [创作技巧](./rag/07-creation-best-practices.md) | 好作品方法论 |
| [发布与发现](./rag/09-publish-and-discover.md) | 公域发布、主页 |
| [会员与额度](./rag/10-membership-and-billing.md) | 套餐、计费 |
| [账号与设置](./rag/11-account-and-settings.md) | 资料、作品管理 |
| [常见问题](./rag/12-faq.md) | FAQ |
| [术语表](./rag/13-glossary.md) | 用户名词解释 |

## 业务文档（商业计划书素材）

面向产品、运营、融资的**业务梳理**，均基于当前代码与文案整理：

→ **[docs/business/](./business/README.md)**

| 文档 | 内容 |
|------|------|
| [产品定位与价值主张](./business/product-positioning.md) | 问题、解决方案、差异化 |
| [目标用户与场景](./business/target-users.md) | 用户画像、使用场景 |
| [用户旅程](./business/user-journeys.md) | 获客→激活→变现→留存 |
| [功能目录](./business/feature-catalog.md) | 功能清单与实现状态 |
| [创作方法论](./business/creation-methodology.md) | 灵感·大纲·创作·提问与侧栏/聊天分工 |
| [内容与社区](./business/content-ecosystem.md) | 发现灵感、发布、主页 |
| [内容分类体系](./business/content-taxonomy.md) | taxonomy、推断与发布确认 |
| [商业化与定价](./business/monetization.md) | 套餐、计费、单位经济 |
| [竞争与替代](./business/competitive-positioning.md) | 定位、SWOT |
| [产品成熟度与规划](./business/product-maturity.md) | 缺口、路线图、风险 |

撰写商业计划书时，建议结构：

1. 执行摘要 ← `product-positioning` + `monetization` 摘要  
2. 市场与用户 ← `target-users` + `competitive-positioning`  
3. 产品与服务 ← `creation-methodology` + `feature-catalog`  
4. 商业模式 ← `monetization`  
5. 运营与增长 ← `user-journeys` + `content-ecosystem`  
6. 进展与计划 ← `product-maturity`  

**完整初稿**：[business/business-plan.md](./business/business-plan.md)

## 商业计划书素材库（BP）

面向 BP 撰写的**事实底稿 + 按章节归档的素材**，事实部分核验自当前代码（定价、计量、模型、数据模型、功能状态），并标注「已核验 / 待调研 / 待填」：

→ **[docs/bp/](./bp/README.md)**

> 与 `docs/business/` 互补；凡涉定价、套餐、计量单位等，以 [bp/00-fact-sheet.md](./bp/00-fact-sheet.md) 为准。

## 产品介绍视频

面向对外宣传的介绍片脚本与录制方案（Word 文档）：

→ **docs/video-intro/**

| 文档 | 内容 |
|------|------|
| [有感介绍视频-素材库说明.docx](./video-intro/有感介绍视频-素材库说明.docx) | 索引、成片规格、叙事主线 |
| [有感介绍视频-旁白脚本.docx](./video-intro/有感介绍视频-旁白脚本.docx) | 分镜旁白、字幕要点、精简版与全文 |
| [有感介绍视频-录制方案.docx](./video-intro/有感介绍视频-录制方案.docx) | 分镜、设备、剪辑、交付规格 |
| [有感介绍视频-录屏检查清单.docx](./video-intro/有感介绍视频-录屏检查清单.docx) | 演示数据与逐镜勾选 |

## 技术文档

| 文档 | 说明 |
|------|------|
| [根目录 README](../README.md) | Monorepo 架构、本地开发、常用命令 |
| [apps/web/README.md](../apps/web/README.md) | 前端路由、环境变量 |
| [apps/api/README.md](../apps/api/README.md) | API 路由、Prisma、OpenAPI |
| [apps/agent/README.md](../apps/agent/README.md) | LangGraph、模型分工 |
| [technical/agent-turn-queue.md](./technical/agent-turn-queue.md) | 回合队列、子图路由、API 线程同步 |
| [technical/version-graph.md](./technical/version-graph.md) | 单线版本历史、restore、duplicate |
| [technical/design-image-generation.md](./technical/design-image-generation.md) | 设计任务文生图：画幅推断、出图、物化落库、前端展示 |

## 文档维护原则

- **RAG 用户文档**随产品文案、定价、功能门禁变更而更新；以 `site-copy.ts` 与 `subscription-plans.ts` 为 C 端准绳。
- **业务文档**随产品文案、定价、功能门禁变更而更新。
- **技术文档**随架构、命令、环境变量变更而更新。
- 商业计划书中的**市场规模数字**需另行调研，业务文档不提供虚构 TAM 数据。
