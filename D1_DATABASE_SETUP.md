# Cloudflare D1 数据库设置指南

## 概述

本指南将帮助你设置 Cloudflare D1 数据库来存储用户信息和使用统计。

---

## 第一步：创建 D1 数据库

### 1.1 使用 Wrangler CLI

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

**重要**：复制 `database_id` 的值，后面需要用到。

### 1.2 使用 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 点击 "D1" → "Create database"
4. 数据库名称：`bg-remover-db`
5. 点击 "Create"

复制生成的 `Database ID`。

---

## 第二步：初始化数据库表

### 2.1 使用 Wrangler CLI

```bash
wrangler d1 execute bg-remover-db --remote --file=./schema.sql
```

这将执行 `schema.sql` 中的 SQL 语句，创建所有必需的表和索引。

### 2.2 使用 Cloudflare Dashboard

1. 访问 D1 数据库详情页面
2. 点击 "Console" 标签
3. 复制 `schema.sql` 的内容
4. 粘贴到 SQL 编辑器
5. 点击 "Execute"

---

## 第三步：配置 Wrangler

编辑 `wrangler.toml` 文件，更新 `database_id`：

```toml
name = "image-background-remover"
main = "src/worker.ts"
compatibility_date = "2024-01-01"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "bg-remover-db"
database_id = "your-database-id-here"  # 替换为实际的 database_id
```

替换 `your-database-id-here` 为你在第一步复制的 `database_id`。

---

## 第四步：部署 Worker

### 4.1 使用 Wrangler CLI

```bash
wrangler deploy
```

这将部署 Worker，并自动绑定 D1 数据库。

### 4.2 使用 Cloudflare Dashboard

1. 访问 Workers & Pages
2. 创建 Worker 或编辑现有 Worker
3. 在 "Settings" → "D1 databases" 中绑定数据库
4. 上传 `src/worker.ts` 的内容
5. 点击 "Deploy"

---

## 第五步：获取 Worker URL

部署成功后，你将获得一个 Worker URL，格式如下：

```
https://image-background-remover.your-subdomain.workers.dev
```

复制这个 URL，稍后需要在 Cloudflare Pages 环境变量中配置。

---

## 第六步：配置 Cloudflare Pages 环境变量

1. 访问 Cloudflare Pages Dashboard
2. 进入项目 `image-background-remover`
3. 导航到 "Settings" → "Environment variables"
4. 添加/更新以下环境变量：

```bash
NEXTAUTH_URL=https://backgroundremoverpro.online
NEXTAUTH_SECRET=[之前生成的密钥]
GOOGLE_CLIENT_ID=[你的 Google Client ID]
GOOGLE_CLIENT_SECRET=[你的 Google Client Secret]
REMOVE_BG_API_KEY=[已有的]
WORKER_URL=https://image-background-remover.your-subdomain.workers.dev
```

**注意**：`WORKER_URL` 是你在第五步获取的 Worker URL。

5. 保存所有环境变量
6. 重新部署项目

---

## 数据库表结构

### users 表

存储 Google OAuth 用户信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 用户唯一标识（user_{google_id}） |
| google_id | TEXT | Google 用户 ID |
| email | TEXT | 用户邮箱 |
| name | TEXT | 用户姓名 |
| avatar_url | TEXT | 头像 URL |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| last_login_at | DATETIME | 最后登录时间 |

### usage_stats 表

存储用户使用统计。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | TEXT | 用户 ID（外键） |
| images_processed | INTEGER | 已处理图片数 |
| last_processed_at | DATETIME | 最后处理时间 |

### 索引

- `idx_users_google_id` - 加速 Google ID 查询
- `idx_users_email` - 加速邮箱查询
- `idx_usage_stats_user_id` - 加速用户统计查询

---

## 测试数据库连接

### 1. 健康检查

访问：
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

### 2. 创建/更新用户

使用 curl 测试：

```bash
curl -X POST https://your-worker-url/api/user/create-or-update \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "123456789",
    "email": "test@example.com",
    "name": "Test User",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

### 3. 查询用户

```bash
curl "https://your-worker-url/api/user/get-by-google-id?googleId=123456789"
```

---

## 常见问题

### Q1: Worker 部署失败，提示 "database not found"

**A**: 检查 `wrangler.toml` 中的 `database_id` 是否正确，确保 D1 数据库已创建。

### Q2: 数据库表创建失败

**A**:
1. 确认 `schema.sql` 文件存在
2. 检查 SQL 语法是否正确
3. 查看错误日志，可能需要分步执行 SQL 语句

### Q3: 用户登录后没有保存到数据库

**A**:
1. 检查 `WORKER_URL` 环境变量是否正确
2. 检查 Worker 是否正常运行
3. 查看浏览器控制台和 Worker 日志

### Q4: 使用统计不更新

**A**:
1. 确认 Worker API 正常响应
2. 检查 `/api/remove-bg` 路由是否正确调用 Worker API
3. 查看数据库中 `usage_stats` 表的数据

---

## 数据库管理

### 查看数据

使用 Wrangler CLI：

```bash
# 查询所有用户
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM users"

# 查询使用统计
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM usage_stats"

# 联合查询
wrangler d1 execute bg-remover-db --remote \
  --command="SELECT u.email, us.images_processed FROM users u JOIN usage_stats us ON u.id = us.user_id"
```

### 删除用户

```bash
wrangler d1 execute bg-remover-db --remote \
  --command="DELETE FROM users WHERE google_id = 'your-google-id'"
```

由于外键约束，删除用户会自动删除对应的使用统计。

### 备份数据

```bash
# 导出用户数据
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM users" --json > users-backup.json

# 导出使用统计
wrangler d1 execute bg-remover-db --remote --command="SELECT * FROM usage_stats" --json > usage-backup.json
```

---

## 监控和日志

### Worker 日志

```bash
wrangler tail
```

### D1 查询日志

在 Cloudflare Dashboard 中查看 D1 数据库的 "Metrics" 和 "Analytics"。

---

## 安全建议

1. **访问控制**：确保 Worker 的 API 不暴露敏感信息
2. **速率限制**：考虑在 Worker 中添加 API 速率限制
3. **数据验证**：始终验证输入数据
4. **定期备份**：定期导出重要数据
5. **监控异常**：设置告警监控异常查询和错误

---

## 下一步

数据库设置完成后：

1. ✅ 测试用户登录功能
2. ✅ 验证数据正确保存
3. ✅ 测试使用统计功能
4. ✅ 添加用户管理界面（可选）
5. ✅ 添加数据分析仪表板（可选）
