# @yougan/api

Express 中间层：用户鉴权、作品与发布 CRUD、文件上传、订阅计费，以及面向前端的 LangGraph SDK 兼容代理。

默认开发地址：`http://localhost:4000`

## 职责

- **REST API**：`/api/*` 业务接口，Zod 校验 + OpenAPI 描述
- **LangGraph 代理**：`/langgraph` 转发到 `AGENT_URL`，注入 JWT 用户与 `X-Work-Id` 作品上下文
- **静态文件**：`local` 模式经 `/api/files` 代理；`oss` 模式上传至阿里云 OSS 并返回公网对象 URL（`/api/files` 仍可用于历史链接）
- **API 文档**：Swagger UI `/docs`，原始 spec `/openapi.json`

前端不直连 Agent；所有对话流经本服务的鉴权代理。

## 开发

在 monorepo 根目录：

```bash
cp apps/api/.env.example apps/api/.env
docker compose up -d
pnpm db:push
pnpm dev:api
```

或在 `apps/api` 目录：

```bash
cp .env.example .env
pnpm dev
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | `tsx watch` 热重载 |
| `pnpm build` / `pnpm check-types` | TypeScript 检查 |
| `pnpm db:push` | 同步 schema 并 `prisma generate`（Prisma 7，需 Node ≥ 20.19） |
| `pnpm db:generate` | 生成 `@prisma/client` |

数据库连接在 `prisma.config.ts`（读取 `DATABASE_URL`），不再写在 `schema.prisma`。
| `pnpm db:generate` | 生成 Prisma Client（`postinstall` 也会执行） |
| `pnpm openapi:generate` | 生成 `openapi/openapi.json` |

## 环境变量

复制 `.env.example` 为 `.env`。本地开发只需以下变量（其余在代码中有默认值，或见下方说明）：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | API 业务库 |
| `JWT_SECRET` | 是 | 签发/校验访问令牌 |
| `PORT` | 否 | 默认 `4000` |
| `AGENT_URL` | 否 | LangGraph 服务，默认 `http://localhost:2024` |
| `RAG_SERVICE_URL` | 否 | RAG 客服上游，默认 `http://localhost:8000` |
| `STORAGE_DRIVER` | 否 | `local`（默认）或 `oss` |
| `STORAGE_LOCAL_DIR` | 否 | 本地上传目录，默认 `./storage` |
| `PUBLIC_BASE_URL` | 否 | 对外 API 根 URL，默认 `http://localhost:4000` |

按需追加（未写入 `.env.example`）：

- `REDIS_URL` — 启用 Redis 缓存；不设则禁用
- `WEB_APP_URL` — 邮件中的前端链接，默认 `http://localhost:3000`
- `SMTP_*` / `MAIL_FROM` — 发信；未配置时开发环境将重置链接打印到控制台
- `OSS_*` — 仅当 `STORAGE_DRIVER=oss` 时需要

## 目录结构

```
apps/api/
├── prisma/
│   └── schema.prisma      # 数据模型
├── openapi/
│   ├── registry.ts        # Zod → OpenAPI 注册
│   └── openapi.json       # 生成产物（勿手改）
├── scripts/
│   └── generate-openapi.ts
└── src/
    ├── index.ts           # 入口
    ├── app.ts             # Express 应用装配
    ├── env.ts             # 环境变量
    ├── schemas.ts         # 共享 Zod schema
    ├── middleware/        # auth 等
    ├── routes/            # 路由模块
    ├── services/          # 业务逻辑
    └── lib/               # redis、mail、storage、订阅计划等
```

## API 路由

| 前缀 | 模块 | 说明 |
|------|------|------|
| `/api/auth` | `routes/auth.ts` | 注册、登录、邮箱确认、密码重置 |
| `/api/users` | `routes/users.ts` | 用户资料、头像封面 |
| `/api/works` | `routes/works.ts` | 作品 CRUD、versions/restore/duplicate、agent-context |
| `/api/work-groups` | `routes/work-groups.ts` | 作品分组 |
| `/api/publications` | `routes/publications.ts` | 发布内容、公开阅读 |
| `/api/upload` | `routes/upload.ts` |  multipart 上传 |
| `/api` | `routes/upload.ts` | `filesRouter` 静态文件访问 |
| `/api/subscription` | `routes/subscription.ts` | 当前订阅与用量 |
| `/api/billing` | `routes/billing.ts` | 订单与支付状态 |
| `/api/v1/chat` | `routes/rag-chat-proxy.ts` | RAG 客服 Agent 代理（AG-UI SSE，转发至 `RAG_SERVICE_URL`） |
| `/agent` | `routes/agent-proxy.ts` | LangGraph SDK 代理（需登录 + `X-Work-Id`） |
| `/health` | `app.ts` | 健康检查（含 Redis 状态） |
| `/docs` | `app.ts` | Swagger UI |

## 数据模型（Prisma）

核心实体：

- **User** — 账号、资料、头像/封面
- **Work** — 物化视图：`profile`、`references`、`productionPlan`、`preview`（JSON），`headVersionId`
- **WorkVersion** — 单线版本快照（仅作品预览里程碑）
- **WorkConversation** — 多轮对话（共享作品状态）：`threadId`
- **WorkGroup** — 作品分组
- **Publication** — 对外发布的内容（草稿/已发布、阅读统计）
- **UserSubscription** / **BillingOrder** — 会员与账单

`WorkConversation` 与 LangGraph `threadId` 一一对应；创作阶段由 Agent 回合队列 workflow，不再持久化对话模式字段。

## LangGraph 代理

`POST /langgraph/*` 经 `requireAuth` 与 `injectWorkContext` 后转发到 Agent：

- 校验 JWT，解析当前用户
- 读取请求头 `X-Work-Id`、`X-Conversation-Id`，加载作品并校验归属
- 按 `X-Work-Id`、`X-Conversation-Id` 注入作品状态（`profile`、`references`、`productionPlan`、`preview` 等）；stream 结束后 `applyAgentRunToWork` 写 version
- 侧栏 `PATCH Work` 更新物化列后同步 LangGraph thread（`agent-thread-sync`）；聊天消息经任务队列路由对话子图，见 [agent-turn-queue.md](../../docs/technical/agent-turn-queue.md)

详见 [docs/technical/version-graph.md](../../docs/technical/version-graph.md)。

Agent 服务需单独启动（`pnpm dev:agent`）。

## OpenAPI 工作流

1. 在 `src/schemas.ts` 或路由中维护 Zod schema，并在 `openapi/registry.ts` 注册
2. 运行 `pnpm openapi:generate`
3. 前端在根目录执行 `pnpm generate:api` 更新 TypeScript 类型

未生成 spec 时访问 `/openapi.json` 返回 503。

## 数据库

v0 阶段直接用 schema 同步，不维护 SQL 迁移：

```bash
pnpm db:push
```

根目录 `docker-compose.yml` 提供单个 Postgres 实例（`:5432`）；本服务使用 `yougan_api` 库，Agent checkpoint 使用同实例下的 `yougan_agent` 库，不在此 Prisma schema 中。

## 技术栈

- Express 5、Prisma 6、Zod、`@asteasolutions/zod-to-openapi`
- JWT（`jsonwebtoken`）、bcrypt 密码哈希
- `http-proxy-middleware` 代理 LangGraph
- `ioredis` 可选缓存层
- `ali-oss` + 本地目录双模式存储
- `nodemailer` 可选邮件

## 相关文档

- [根目录 README](../../README.md) — 全栈启动与架构
- [apps/agent/README.md](../agent/README.md) — Agent graph 与模型
