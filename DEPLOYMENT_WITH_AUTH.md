# 部署指南（含 Google OAuth）

## 本地测试

### 1. 安装依赖
```bash
cd /tmp/image-background-remover
npm install
```

### 2. 配置环境变量
复制 `.env.local.example` 为 `.env.local`：
```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入以下信息：
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[使用 openssl rand -base64 32 生成]
GOOGLE_CLIENT_ID=[你的 Google Client ID]
GOOGLE_CLIENT_SECRET=[你的 Google Client Secret]
REMOVE_BG_API_KEY=[你的 remove.bg API Key]
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 测试登录功能。

---

## Cloudflare Pages 部署

### 1. 提交代码到 GitHub

```bash
cd /tmp/image-background-remover
git add .
git commit -m "feat: add Google OAuth authentication"
git push origin main
```

### 2. 配置 Cloudflare Pages 环境变量

访问 [Cloudflare Pages Dashboard](https://dash.cloudflare.com/):

1. 进入你的项目 `image-background-remover`
2. 点击 "Settings" → "Environment variables"
3. 添加以下环境变量：

```
NEXTAUTH_URL=https://backgroundremoverpro.online
NEXTAUTH_SECRET=[生成的密钥]
GOOGLE_CLIENT_ID=[你的 Google Client ID]
GOOGLE_CLIENT_SECRET=[你的 Google Client Secret]
REMOVE_BG_API_KEY=[你的 remove.bg API Key]
```

### 3. 触发重新部署

在 Cloudflare Pages 中点击 "Deployments" → "Retry deployment" 或推送新代码触发部署。

### 4. 测试

部署完成后，访问 https://backgroundremoverpro.online 测试：
- 点击 "Google 登录" 按钮
- 授权 Google 账号
- 登录后应该显示用户头像和名称
- 可以正常上传和处理图片

---

## Google Cloud Console 配置

如果还没有配置 Google OAuth，按照以下步骤：

### 1. 创建或选择项目
访问 https://console.cloud.google.com/

### 2. 启用 API
- 导航到 "APIs & Services" → "Library"
- 搜索并启用 "Google Identity Platform API"

### 3. 配置 OAuth 同意屏幕
- 导航到 "APIs & Services" → "OAuth consent screen"
- 选择 "External" 用户类型
- 填写应用信息：
  - 应用名称：Image Background Remover
  - 用户支持电子邮件：[你的邮箱]
  - 开发者联系信息：[你的邮箱]

### 4. 创建 OAuth 客户端 ID
- 导航到 "APIs & Services" → "Credentials"
- 点击 "Create Credentials" → "OAuth Client ID"
- 应用类型：**Web application**
- 名称：Image Background Remover
- 授权的重定向 URI：
  ```
  https://backgroundremoverpro.online/api/auth/callback/google
  https://image-background-remover-5ky.pages.dev/api/auth/callback/google
  http://localhost:3000/api/auth/callback/google
  ```
- 点击 "Create"

### 5. 复制凭证
- **Client ID**: 以 `.apps.googleusercontent.com` 结尾
- **Client Secret**: 点击复制按钮

### 6. 配置授权域名
- 在 "OAuth consent screen" 中点击 "Add domain"
- 添加以下域名：
  - backgroundremoverpro.online
  - image-background-remover-5ky.pages.dev
  - localhost

---

## 故障排查

### 问题 1：登录后重定向失败

**原因**：`NEXTAUTH_URL` 配置错误

**解决**：确保 `NEXTAUTH_URL` 与实际访问的域名一致（包括 https://）

### 问题 2：Google OAuth 错误 "redirect_uri_mismatch"

**原因**：Google Console 中的重定向 URI 配置不正确

**解决**：在 Google Console 中添加完整的回调 URL，包括 `/api/auth/callback/google`

### 问题 3：登录状态丢失

**原因**：浏览器 Cookie 设置问题

**解决**：
- 确保浏览器允许第三方 Cookie
- 检查 Cloudflare SSL/TLS 设置，确保使用 "Full" 模式

### 问题 4：部署后无法登录

**原因**：生产环境环境变量未配置

**解决**：
- 检查 Cloudflare Pages 环境变量配置
- 确保 `NEXTAUTH_SECRET` 已设置
- 重新部署项目

---

## 安全建议

1. **环境变量管理**
   - 不要将 `.env.local` 提交到 Git
   - 定期轮换 `NEXTAUTH_SECRET` 和 `GOOGLE_CLIENT_SECRET`

2. **Google OAuth 配置**
   - 在 Google Console 中配置应用验证，避免使用未验证的应用
   - 限制允许的用户（如需要）

3. **速率限制**
   - 考虑在后端 API 中添加速率限制
   - 监控 remove.bg API 额度使用情况

4. **日志监控**
   - 启用 Cloudflare Analytics 监控流量
   - 设置异常登录告警

---

## 下一步优化

### 1. 添加用户使用统计
- 记录每个用户处理了多少张图片
- 显示使用次数限制

### 2. 添加用户偏好设置
- 记录用户常用的设置
- 自定义输出格式

### 3. 集成其他登录方式
- GitHub OAuth
- Email 登录

### 4. 添加用户反馈
- 用户满意度调查
- 功能建议收集
