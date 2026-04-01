# Google OAuth 集成 - 快速检查清单

## ✅ 已完成
- [x] 代码已修改并提交
- [x] next-auth 已安装
- [x] Google OAuth API 路由已创建
- [x] 登录界面已添加
- [x] 代码已推送到 GitHub

## 🔜 待完成

### 第一步：Google Cloud Console (10-15 分钟)

- [ ] 访问 https://console.cloud.google.com/
- [ ] 创建/选择项目
- [ ] 启用 "Google Identity Platform API"
- [ ] 配置 OAuth 同意屏幕
  - [ ] 应用名称：Image Background Remover
  - [ ] 用户支持电子邮件
  - [ ] 开发者联系信息
- [ ] 创建 OAuth 客户端 ID
  - [ ] 应用类型：Web application
  - [ ] 添加重定向 URI：
    - [ ] https://backgroundremoverpro.online/api/auth/callback/google
    - [ ] https://image-background-remover-5ky.pages.dev/api/auth/callback/google
    - [ ] http://localhost:3000/api/auth/callback/google
- [ ] 复制 Client ID：____________________________
- [ ] 复制 Client Secret：_________________________
- [ ] 在授权域名中添加：
  - [ ] backgroundremoverpro.online
  - [ ] image-background-remover-5ky.pages.dev

**详细步骤**：参考 `AUTH_SETUP.md`

---

### 第二步：配置 Cloudflare Pages (5 分钟)

- [ ] 访问 Cloudflare Pages Dashboard
- [ ] 进入项目 `image-background-remover`
- [ ] 点击 "Settings" → "Environment variables"
- [ ] 添加以下环境变量：

```
NEXTAUTH_URL=https://backgroundremoverpro.online
NEXTAUTH_SECRET=[运行: openssl rand -base64 32]
GOOGLE_CLIENT_ID=[从上面复制的 Client ID]
GOOGLE_CLIENT_SECRET=[从上面复制的 Client Secret]
REMOVE_BG_API_KEY=[已有的]
```

- [ ] 保存所有环境变量
- [ ] 点击 "Deployments" → "Retry deployment"
- [ ] 等待部署完成（约 2-3 分钟）

---

### 第三步：测试 (5 分钟)

- [ ] 访问 https://backgroundremoverpro.online
- [ ] 确认看到 "Google 登录" 按钮
- [ ] 点击登录，跳转到 Google
- [ ] 授权应用
- [ ] 确认登录成功（显示用户头像和姓名）
- [ ] 测试上传图片功能
- [ ] 测试登出功能
- [ ] 测试重新登录

---

## 📝 生成 NEXTAUTH_SECRET

运行以下命令：

```bash
openssl rand -base64 32
```

示例输出：
```
abc123xyz789...（复制整个输出）
```

---

## 🔧 常见问题

| 问题 | 解决方案 |
|------|---------|
| "redirect_uri_mismatch" | 检查 Google Console 的重定向 URI |
| "Invalid NextAuth URL" | 检查 `NEXTAUTH_URL` 环境变量 |
| 部署后功能未生效 | 确认环境变量已保存并重新部署 |
| 无法登录 | 检查浏览器控制台错误信息 |

---

## 📚 参考文档

- **Google 设置**：`AUTH_SETUP.md`
- **部署指南**：`DEPLOYMENT_WITH_AUTH.md`
- **实现总结**：`IMPLEMENTATION_SUMMARY.md`

---

## 🎯 预计总时间

- Google Cloud 配置：10-15 分钟
- Cloudflare Pages 配置：5 分钟
- 测试：5 分钟
- **总计**：20-25 分钟

---

## ✨ 完成后

你将拥有：
- ✅ 支持Google OAuth 登录的背景移除工具
- ✅ 用户会话管理
- ✅ 登录状态检查
- ✅ 美观的用户界面

**开始吧！** 🚀
