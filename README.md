# 有感 Yougan

AI 创作助手：帮你收集灵感、制定制作计划，再按计划生成内容。

Monorepo 采用 **pnpm workspace** + **Turborepo**，三服务协作：前端、Express 中间层、LangGraph Agent。

## 仓库结构

```
yougan/
├── apps/
│   ├── web/      # Vite + React 前端（落地页 + /studio 创作台）
│   ├── api/      # Express 中间层（鉴权、作品 CRUD、OSS、Agent 代理）
│   └── agent/    # LangGraph Agent（回合队列 + 四对话子图）
├── docs/         # 运维与集成文档（如平台 OAuth）
├── docker-compose.yml
├── package.json
└── turbo.json
```

各应用详细说明见：

| 应用  | README                                         |
| ----- | ---------------------------------------------- |
| 前端  | [apps/web/README.md](./apps/web/README.md)     |
| API   | [apps/api/README.md](./apps/api/README.md)     |
| Agent | [apps/agent/README.md](./apps/agent/README.md) |
| 文档  | [docs/README.md](./docs/README.md)             |

## 架构

```
浏览器 (apps/web :3000)
  ↓ REST / OpenAPI
中间层 (apps/api :4000) — JWT、作品元数据、上传、LangGraph 代理
  ├─→ Postgres API (:5432) — 用户、作品、发布、订阅（Prisma）
  ├─→ Redis (:6379) — 可选缓存（未配置则直连 DB）
  └─→ Agent (apps/agent :2024) — yougan graph（resolveTurnQueue → 对话子图）
        └─→ Postgres Agent (:5433) — LangGraph checkpoint / 会话状态
```

前端对话流经 API 的 `/langgraph` 代理转发到 Agent，请求需携带 JWT 与 `X-Work-Id`，由中间层注入作品上下文。

## 环境要求

- **Node.js** ≥ 20
- **pnpm** ≥ 9（推荐与 `packageManager` 字段一致：`pnpm@10.30.3`）
- **Docker**（本地 Postgres × 2 + Redis）

## 快速开始

### 0. 安装依赖

项目根目录 `.npmrc` 已配置 **npmmirror** 镜像（国内访问 npmjs 易 `ETIMEDOUT`）：

```bash
pnpm install
```

若仍失败，可尝试：

```bash
pnpm install --registry=https://registry.npmmirror.com
pnpm config set network-concurrency 4
pnpm install
```

海外或能直连 npmjs 时，可删除 `.npmrc` 中的 `registry=` 行，改回官方源。

### 1. 启动基础设施

```bash
docker compose up -d
```

| 服务             | 端口 | 用途                               |
| ---------------- | ---- | ---------------------------------- |
| `postgres-api`   | 5432 | API 业务库 `yougan_api`            |
| `postgres-agent` | 5433 | Agent checkpoint 库 `yougan_agent` |
| `redis`          | 6379 | API 可选缓存                       |

### 2. 环境变量

```bash
cp apps/api/.env.example apps/api/.env
cp apps/agent/.env.example apps/agent/.env
cp apps/web/.env.local.example apps/web/.env.local
```

**本地开发最少需要：**

- `apps/api/.env`：`DATABASE_URL`、`JWT_SECRET`
- `apps/agent/.env`：`POSTGRES_URI`、`DASHSCOPE_API_KEY`（百炼 OpenAI 兼容端点，必填方可调用 LLM）；可选 `LANGSMITH_*` 开启 trace
- `apps/web/.env.local`：默认指向 `http://localhost:4000` 即可

### 3. 初始化数据库

```bash
pnpm db:push
```

Schema 变更后执行上述命令即可；v0 不维护 Prisma migrations。

### 4. 启动开发服务

```bash
# 并行启动 web + api + agent
pnpm dev

# 或单独启动
pnpm dev:web    # http://localhost:3000
pnpm dev:api    # http://localhost:4000
pnpm dev:agent  # http://localhost:2024
```

打开创作台：`http://localhost:3000/studio`  
API 文档（需已生成 OpenAPI）：`http://localhost:4000/docs`

### 5. 生成前端 API 类型（可选）

修改 API 路由或 Zod schema 后：

```bash
pnpm openapi:generate   # 更新 apps/api/openapi/openapi.json
pnpm generate:api       # 生成 apps/web/src/services/generated/schema.d.ts
```

## 常用命令

| 命令                            | 说明                            |
| ------------------------------- | ------------------------------- |
| `pnpm dev`                      | Turborepo 并行启动所有 dev 服务 |
| `pnpm build`                    | 构建所有 app（类型检查）        |
| `pnpm check-types`              | 全仓 TypeScript 检查            |
| `pnpm lint`                     | ESLint（web）                   |
| `pnpm db:push`                  | Prisma 同步 API schema 到数据库 |
| `pnpm db:generate`              | 重新生成 Prisma Client          |
| `pnpm openapi:generate`         | 从 Zod 路由生成 OpenAPI JSON    |
| `pnpm generate:api`             | 从 OpenAPI 生成前端类型         |
| `pnpm --filter @yougan/web dev` | 对单个 workspace 包执行脚本     |

## 创作流程

一件 **作品（Work）** 对应一段持续对话与一个 LangGraph `threadId`。Agent 每条用户消息经 **回合队列** 自动编排，路由到灵感 / 大纲 / 创作 / 提问等对话子图（详见 [docs/technical/agent-turn-queue.md](./docs/technical/agent-turn-queue.md)）。

| 阶段 | 行为 |
| ---- | ---- |
| 灵感 | 提问、确认需求，不直接出稿 |
| 大纲 | 确认章节结构与叙事顺序 |
| 创作 | 创意总监制定制作计划，制作团队按任务出稿 |
| 提问 | 自由答疑与创作咨询 |

作品 JSON 字段存于 API 库；对话 checkpoint 存于 Agent 库。

## 功能概览

- 用户注册登录、邮箱确认、密码重置
- 作品分组、侧栏同步、多模式 AI 对话
- 内容发布与公开阅读（`/content`）
- 用户主页与资料设置
- 会员订阅与账单（免费版 / Pro）
- 第三方平台 OAuth 绑定与发布（见 [docs/platform-oauth.md](./docs/platform-oauth.md)）
- 本地或 S3 兼容对象存储上传

## 技术栈

| 层级     | 技术                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- |
| Monorepo | pnpm + Turborepo                                                                            |
| 前端     | Vite、React 19、React Router、TanStack Query、Jotai、Tailwind v4、LangGraph SDK `useStream` |
| 中间层   | Express 5、Prisma、JWT、Zod + OpenAPI、http-proxy-middleware、ioredis                       |
| Agent    | LangGraph JS、百炼 DashScope（qwen3.7-max 对话、deepseek-v4-pro 结构化、Qwen-Image 文生图） |
| 存储     | PostgreSQL × 2、Redis（可选）、本地目录 / S3 兼容 OSS                                       |

## 故障排查

| 现象                 | 可能原因                                         |
| -------------------- | ------------------------------------------------ |
| `pnpm install` 超时  | 使用 npmmirror 或检查代理                        |
| API 启动报数据库错误 | `docker compose up -d` 后执行 `pnpm db:push`     |
| Studio 对话无响应    | 确认 `dev:agent` 已启动且 `DASHSCOPE_API_KEY` 有效 |
| `/docs` 503          | 在 `apps/api` 执行 `pnpm openapi:generate`       |
| LangGraph 401        | 前端未登录或 JWT 过期；代理路径应为 `/langgraph` |

## 许可证

私有项目，未经授权请勿分发。
