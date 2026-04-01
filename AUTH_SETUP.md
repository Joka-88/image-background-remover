# Google OAuth 设置指南

## 第一步：在 Google Cloud Console 配置 OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API：
   - 导航到 "APIs & Services" > "Library"
   - 搜索 "Google Identity"
   - 启用 "Google Identity Platform API"

4. 创建 OAuth 凭证：
   - 导航到 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "OAuth Client ID"
   - 应用类型选择：**Web application**
   - 名称：Image Background Remover

5. 配置授权重定向 URI（Authorized redirect URIs）：
   ```
   https://backgroundremoverpro.online/api/auth/callback/google
   https://image-background-remover-5ky.pages.dev/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

6. 记录以下信息：
   - **Client ID**（以 `.apps.googleusercontent.com` 结尾）
   - **Client Secret**

7. 配置授权域名：
   - 在 "OAuth consent screen" 中添加以下域名：
     - backgroundremoverpro.online
     - image-background-remover-5ky.pages.dev
     - localhost

## 第二步：配置环境变量

在 Cloudflare Pages 项目中添加以下环境变量：

```
NEXTAUTH_URL=https://backgroundremoverpro.online
NEXTAUTH_SECRET=[生成一个随机字符串，使用：openssl rand -base64 32]
GOOGLE_CLIENT_ID=[你的 Google Client ID]
GOOGLE_CLIENT_SECRET=[你的 Google Client Secret]
REMOVE_BG_API_KEY=[已有的 remove.bg API Key]
```

### 生成 NEXTAUTH_SECRET

运行以下命令生成随机密钥：
```bash
openssl rand -base64 32
```

## 第三步：本地测试

1. 安装依赖：
```bash
cd /tmp/image-background-remover
npm install next-auth
```

2. 创建 `.env.local` 文件（仅用于本地开发）：
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[生成的密钥]
GOOGLE_CLIENT_ID=[你的 Google Client ID]
GOOGLE_CLIENT_SECRET=[你的 Google Client Secret]
REMOVE_BG_API_KEY=[已有的 API Key]
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 访问 http://localhost:3000 测试登录功能

## 注意事项

- `.env.local` 文件不要提交到 Git
- 生产环境变量需要在 Cloudflare Pages Dashboard 中配置
- OAuth Client Secret 是敏感信息，请妥善保管
