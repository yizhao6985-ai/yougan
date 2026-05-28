# 第三方发布平台 OAuth 配置

有感支持将内容发布到小红书、微博、微信公众号、抖音、快手、哔哩哔哩等平台。各平台 OAuth 需在 API 服务环境变量中单独配置。

## 回调地址

所有平台在开放平台登记的 **授权回调 URL** 须为：

```
{PUBLIC_BASE_URL}/api/integrations/oauth/callback
```

本地开发示例：`http://localhost:4000/api/integrations/oauth/callback`

## 环境变量（每个平台一套）

将 `{PLATFORM}` 替换为平台 ID 的大写形式（见下表）。

| 变量 | 必填 | 说明 |
|------|------|------|
| `{PLATFORM}_OAUTH_CLIENT_ID` | 是 | 开放平台应用 Client ID |
| `{PLATFORM}_OAUTH_CLIENT_SECRET` | 是 | Client Secret |
| `{PLATFORM}_OAUTH_AUTHORIZE_URL` | 是 | 用户授权页 URL |
| `{PLATFORM}_OAUTH_TOKEN_URL` | 是 | 用 code 换 token 的接口 URL |
| `{PLATFORM}_OAUTH_SCOPES` | 否 | 授权 scope，空格或逗号分隔 |

### 平台 ID 与 `{PLATFORM}` 前缀

| 平台 | 平台 ID | 环境变量前缀 |
|------|---------|----------------|
| 小红书 | `xiaohongshu` | `XIAOHONGSHU` |
| 微博 | `weibo` | `WEIBO` |
| 微信公众号 | `wechat` | `WECHAT` |
| 抖音 | `douyin` | `DOUYIN` |
| 快手 | `kuaishou` | `KUAISHOU` |
| 哔哩哔哩 | `bilibili` | `BILIBILI` |

### 示例（微博）

```env
WEIBO_OAUTH_CLIENT_ID=your_client_id
WEIBO_OAUTH_CLIENT_SECRET=your_client_secret
WEIBO_OAUTH_AUTHORIZE_URL=https://api.weibo.com/oauth2/authorize
WEIBO_OAUTH_TOKEN_URL=https://api.weibo.com/oauth2/access_token
WEIBO_OAUTH_SCOPES=email
```

将上述变量写入 `apps/api/.env` 后重启 API 服务。

## 配置检查

1. **创作者中心 → 平台集成**：未配置的平台会显示「OAuth 尚未配置」，无法发起授权。
2. **API**（需登录）：`GET /api/integrations/oauth-status` 返回各平台环境变量是否已设置及 OAuth 回调地址。
3. **邮件**：邮箱修改确认依赖 SMTP；未配置时开发环境会在 API 控制台打印确认链接（与密码重置相同）。

## 存储与头像

用户头像、主页封面通过 `POST /api/upload`，表单字段：

- `file`：图片文件
- `purpose`：`avatar`（≤3MB）| `cover`（≤8MB）| `reference`（默认，创作参考图）

需配置 `STORAGE_DRIVER`（`local` 或 `s3`）及 `PUBLIC_BASE_URL`，以便返回可访问的图片 URL。

## 常见问题

| 现象 | 处理 |
|------|------|
| 点击连接返回 503 | 检查对应平台五个必填 OAuth 变量是否齐全并重启 API |
| 授权后跳回设置页报错 | 确认回调 URL 与开放平台登记完全一致（含协议、端口） |
| 本地收不到邮箱确认信 | 配置 SMTP，或查看 API 控制台中的 `[mail] Email change confirmation` 链接 |
