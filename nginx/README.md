# Nginx（Docker）

内网穿透 → 本机 `:3000`（nginx 容器）→ 按路径分流 API / 前端。

| 路径 | 后端 |
|------|------|
| `/api/*`、`/langgraph`、`/docs`、`/openapi.json`、`/health` | 宿主机 API `:4000` |
| 其余 | 宿主机 Vite `:3001`（开发）或 `dist` 静态（生产） |

## 启动

```bash
docker compose up -d
pnpm dev:api
pnpm dev:agent
pnpm --filter @yougan/web dev -- --port 3001 --host 0.0.0.0
```

生产：`pnpm --filter @yougan/web build && docker compose --profile prod up -d nginx-prod`

配置：`default.conf`（开发）、`default.prod.conf`（生产）。改完后 `docker compose restart nginx`。

## 公网环境变量

```env
# apps/web/.env.local
VITE_API_BASE_URL=https://www.yougan.xyz
VITE_LANGGRAPH_API_URL=https://www.yougan.xyz/langgraph

# apps/api/.env
PUBLIC_BASE_URL=https://www.yougan.xyz
WEB_APP_URL=https://www.yougan.xyz
```
