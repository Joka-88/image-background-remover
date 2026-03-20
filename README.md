# 图片背景移除服务

一个基于 Next.js + Tailwind CSS 的图片背景自动移除工具。

## 功能特点

- ✨ 简单易用：点击或拖拽上传图片
- 🚀 快速处理：2-5 秒完成背景移除
- 🎨 美观界面：响应式设计，支持移动端
- 🔒 安全可靠：无数据持久化，保护隐私

## 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS 3.4
- **语言**: TypeScript
- **API**: remove.bg

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 remove.bg API Key：

```
REMOVE_BG_API_KEY=your_api_key_here
```

获取免费 API Key：https://www.remove.bg/zh/api

### 3. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── api/remove-bg/route.ts  # API endpoint
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Main page
│   └── components/                   # Reusable components
├── public/                           # Static assets
└── MVP_REQUIREMENTS.md              # Requirements document
```

## 部署

### Vercel（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量 `REMOVE_BG_API_KEY`
4. 部署

### 其他平台

- Netlify
- Cloudflare Pages
- Railway
- Render

## 功能说明

### 支持的图片格式

- JPG / JPEG
- PNG
- WEBP

### 文件大小限制

- 最大 12MB（remove.api API 限制）

## 注意事项

- remove.bg 免费额度：50 张/月
- 如需更多处理次数，请升级到付费套餐
- 本项目仅用于学习和个人使用

## 后续规划

- [ ] 用户注册/登录
- [ ] 批量处理
- [ ] 历史记录
- [ ] 高级处理参数
- [ ] 开源模型集成

## License

MIT
