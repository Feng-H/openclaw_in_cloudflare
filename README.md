# 🦞 OpenClaw Bot

> A Serverless AI Agent living in Telegram, powered by Cloudflare Workers & Zhipu AI (GLM-4).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange)
![AI](https://img.shields.io/badge/AI-GLM--4%20Flash-green)

**OpenClaw** 是一个开源的 Telegram 机器人代理。它不仅仅是一个聊天机器人，更是一个能够主动抓取全网信息、聚合多源数据并生成深度简报的 AI 助理。

## ✨ 特性

- **🧠 智能对话**: 集成智谱 GLM-4 Flash 模型，响应迅速，成本低廉。
- **📰 AI 每日简报**: 发送 `/news` 指令，自动聚合以下源并生成中文日报：
  - 🚨 **Hacker News**: 智能筛选 AI/LLM 相关热点。
  - 🚀 **GitHub Trending**: 挖掘本周 GitHub 上最火的新生代 AI 开源项目。
  - 🟣 **Anthropic Blog**: 跟踪 Claude 最新动态。
  - 🔵 **Google AI Blog**: 跟踪 Gemini 最新动态。
- **☁️ Serverless 架构**: 部署在 Cloudflare Workers，无需维护服务器，免费额度充足。

## 🚀 快速部署

### 前置要求
1. **Telegram Bot Token**: 从 [@BotFather](https://t.me/BotFather) 获取。
2. **Cloudflare 账号**: 用于部署 Workers。
3. **智谱 AI Key**: 从 [bigmodel.cn](https://bigmodel.cn) 获取。

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/Feng-H/openclaw_in_cloudflare.git
   cd openclaw_in_cloudflare
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置密钥 (Secrets)**
   ```bash
   npx wrangler secret put TELEGRAM_TOKEN  # 你的 Bot Token
   npx wrangler secret put ZAI_API_KEY     # 你的智谱 API Key
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **绑定 Webhook**
   部署成功后，执行以下命令连接 Telegram：
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>/webhook"
   ```

## 📝 使用方法

- **普通聊天**: 直接给机器人发消息即可。
- **获取简报**: 发送 `/news`，等待约 5-10 秒。

## 🛠 技术栈

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Language**: TypeScript
- **LLM**: Zhipu GLM-4 Flash (via OpenAI-compatible API)

## 📄 License

MIT
