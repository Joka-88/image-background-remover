# 完整部署指南 - D1 数据库 + Google OAuth

## 概述

本指南将帮助你完成以下任务：
1. ✅ 配置 Google OAuth
2. ✅ 创建和初始化 Cloudflare D1 数据库
3. ✅ 部署 Cloudflare Worker（用于 D1 操作）
4. ✅ 配置 Cloudflare Pages 环境变量
5. ✅ 测试完整功能

**预计时间**：30-40 分钟

---

## 前置要求

- ✅ GitHub 账号
- ✅ Cloudflare 账号
- ✅ Google Cloud Console 访问权限
- ✅ Node.js 和 npm 已安装

---

## 第一步：Google Cloud Console 配置 (10-15 分钟)

### 1.1 创建或选择项目

访问 https://console.cloud.google.com/

### 1.2 启用 API

1. 导航到 "APIs & Services" → "Library"
2. 搜索并启用 "Google Identity Platform API"

### 1.3 配置 OAuth 同意屏幕

1. 导航到 "APIs & Services" → "OAuth consent screen"
2. 选择 "External" 用户类型
3. 填写应用信息：
   - 应用名称：Image Background Remover
   - 用户支持电子邮件：[你的邮箱]
   - 开发者联系信息：[你的邮箱]

### 1.4 创建 OAuth 客户端 ID

1. 导航到 "APIs & Services" → "Credentials"
2. 点击 "Create Credentials" → "OAuth Client ID"
3. 应用类型：**Web application**
4. 名称：Image Background Remover
5. 授权重定向 URI（Authorized redirect URIs）：
   ```
   https://backgroundremoverpro.online/api/auth/callback/google
   https://image-background-remover-5ky.pages.dev/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
6. 点击 "Create"

### 1.5 复制凭证
- **Client ID**: `[请从 Google Console 复制]`
- **Client Secret**: `[请从 Google Console 复制]`
- **Client Secret**: `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`

### 1.6 配置授权域名

在 "OAuth consent screen" 中添加以下域名：
- `backgroundremoverpro.online`
- `image-background-remover-5ky.pages.dev`
- `localhost`

---

## 第二步：创建 D1 数据库 (5-10 分钟)

### 2.1 安装 Wrangler CLI（如果未安装）

```bash
npm install -g wrangler
```

### 2.2 登录 Cloudflare

```bash
wrangler login
```

### 2.3 创建数据库

```bash
cd /tmp/image-background-remover
wrangler d1 create bg-remover-db
```

你会看到类似以下输出：

```
✅ Successfully created DB 'bg-remover-db'

[[d1_databases]]
binding = "DB"
database_name = "bg-remover-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要**：复制 `database_id` 的值。

### 2.4 初始化数据库表

```bash
wrangler d1 execute bg-remover-db --remote --file=./schema.sql
```

或者使用自动化脚本：

```bash
./setup-d1.sh
```

### 2.5 更新 wrangler.toml

编辑 `wrangler.toml`，替换 `database_id`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "bg-remover-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 替换为实际的 database_id
```

---

## 第三步：部署 Worker (5 分钟)

### 3.1 使用 Wrangler CLI

```bash
wrangler deploy
```

部署成功后，你会看到类似以下输出：

```
✅ Successfully published your Worker to
  https://image-background-remover-xxx.workers.dev
```

**重要**：复制这个 Worker URL。

---

## 第四步：配置 Cloudflare Pages 环境变量 (5 分钟)

1. 访问 [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. 进入项目 `image-background-remover`
3. 导航到 "Settings" → "Environment variables"
4. 添加以下环境变量：

```bash
NEXTAUTH_URL=https://backgroundremoverpro.online
NEXTAUTH_SECRET=[运行: openssl rand -base64 32]
GOOGLE_CLIENT_ID=[你的 Google Client ID]
GOOGLE_CLIENT_SECRET=[你的 Google Client Secret]
REMOVE_BG_API_KEY=[你已有的]
WORKER_URL=https://image-background-remover-xxx.workers.dev
```

5. 保存所有环境变量
6. 点击 "Deployments" → "Retry deployment"

---

## 第五步：测试 (5-10 分钟)

### 5.1 测试 Worker API

访问 Worker 的健康检查端点：

```
https://your-worker-url/api/health
```

应该返回：

```json
{
  "status": "ok",
  "timestamp": "2026-04-02T00:00:00.000Z"
}
```

### 5.2 测试 Google OAuth

1. 访问 https://backgroundremoverpro.online
2. 点击 "Google 登录" 按钮
3. 授权 Google 账号
4. 确认登录成功（显示用户头像和姓名）

### 5.3 测试数据库操作

登录后，检查用户数据是否保存到数据库：

```bash
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM users"
```

你应该看到刚才登录的用户信息。

### 5.4 测试图片处理和使用统计

1. 上传一张图片
2. 点击 "移除背景"
3. 等待处理完成
4. 检查页面上的 "已处理 X 张图片" 计数
5. 验证数据库中的使用统计：

```bash
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM usage_stats"
```

---

## 常见问题

### Q1: Worker 部署失败

**A**:
- 检查 `wrangler.toml` 配置是否正确
- 确保 `database_id` 有效
- 查看错误日志

### Q2: 登录后用户没有保存到数据库

**A**:
- 检查 `WORKER_URL` 环境变量是否正确
- 确认 Worker 正常运行
- 查看浏览器控制台错误

### Q3: 使用统计不更新

**A**:
- 确认 Worker API 响应正常
- 检查 `/api/remove-bg` 路由配置
- 查看数据库中的 `usage_stats` 表

### Q4: Google OAuth 错误 "redirect_uri_mismatch"

**A**:
- 检查 Google Console 中的重定向 URI
- 确保包含 `/api/auth/callback/google`
- 等待几分钟让配置生效

---

## 数据库管理

### 查看所有用户

```bash
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM users"
```

### 查看使用统计

```bash
wrangler d1 execute bg-remover-db --remote --command="SELECT u.email, us.images_processed FROM users u JOIN usage_stats us ON u.id = us.user_id"
```

### 删除用户

```bash
wrangler d1 execute bg-remover-db --remote --command="DELETE FROM users WHERE google_id = 'xxx'"
```

### 导出数据

```bash
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM users" --json > users.json
```

---

## 监控和日志

### Worker 日志

```bash
wrangler tail
```

### Cloudflare Dashboard

1. Workers & Pages → Workers → 选择 Worker → Analytics
2. Workers & Pages → D1 → 选择数据库 → Metrics

---

## 架构说明

```
用户浏览器
    ↓
Cloudflare Pages (Next.js 应用)
    ↓ (通过 NextAuth)
Google OAuth 认证
    ↓ (保存用户信息)
Cloudflare Worker (D1 API)
    ↓ (存储数据)
Cloudflare D1 数据库
```

### 组件说明

1. **Cloudflare Pages**: 托管 Next.js 应用
2. **Cloudflare Worker**: 提供 D1 数据库操作 API
3. **Cloudflare D1**: 存储用户信息和使用统计
4. **NextAuth**: 处理 Google OAuth 认证
5. **remove.bg API**: 处理图片背景移除

---

## 下一步优化

### 1. 添加使用限制

在数据库中添加字段记录用户配额，并在前端显示剩余次数。

### 2. 添加管理后台

创建一个管理界面，查看所有用户和统计信息。

### 3. 添加数据分析

使用 Cloudflare Analytics 和 D1 数据库进行用户行为分析。

### 4. 添加邮件通知

当用户达到使用限制或出现错误时发送通知。

### 5. 添加更多登录方式

集成 GitHub、Email 等其他登录方式。

---

## 参考文档

- **Google OAuth**: `AUTH_SETUP.md`
- **D1 数据库**: `D1_DATABASE_SETUP.md`
- **NextAuth**: https://next-auth.js.org/
- **Cloudflare D1**: https://developers.cloudflare.com/d1/

---

## 支持

如遇问题，请检查：

1. Cloudflare Pages 部署日志
2. Worker 日志 (`wrangler tail`)
3. 浏览器控制台错误
4. D1 数据库中的数据

---

**祝你部署顺利！** 🚀
