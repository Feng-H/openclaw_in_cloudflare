# 🦞 OpenClaw Bot

> A Serverless AI Agent living in Telegram & Feishu, powered by Cloudflare Workers, Kimi K2.5 & Zhipu AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange)
![AI](https://img.shields.io/badge/AI-Kimi%20K2.5%20%2B%20GLM--4-green)

**OpenClaw** 是一个开源的多平台 AI 机器人代理。它不仅仅是一个聊天机器人，更是一个能够主动抓取全网信息、聚合多源数据并生成深度简报的 AI 助理。

## ✨ 特性

- **🧠 智能对话**:
  - **优先使用** Moonshot Kimi K2.5 模型（已开源，提供免费测试额度）
  - **智能降级** 到智谱 GLM-4 Flash（网络错误/配额耗尽时自动切换）
- **📱 多平台支持**:
  - ✅ **Telegram Bot** - 全球用户首选
  - ✅ **飞书 Bot** - 国内企业办公场景
- **📰 AI 每日简报**: 发送 `/news` 指令，自动聚合以下源并生成中文日报：
  - 🚨 **Hacker News**: 智能筛选 AI/LLM 相关热点。
  - 🚀 **GitHub Trending**: 挖掘本周 GitHub 上最火的新生代 AI 开源项目。
  - 🟣 **Anthropic Blog**: 跟踪 Claude 最新动态。
  - 🔵 **Google AI Blog**: 跟踪 Gemini 最新动态。
- **☁️ Serverless 架构**: 部署在 Cloudflare Workers，无需维护服务器，免费额度充足。

## 🚀 快速部署

### 前置要求

#### 必需配置
1. **Cloudflare 账号**: 用于部署 Workers。
2. **智谱 AI Key**: 从 [bigmodel.cn](https://bigmodel.cn) 获取（作为备用模型）。
3. **平台选择**（至少选择一个）：
   - **Telegram Bot Token**: 从 [@BotFather](https://t.me/BotFather) 获取
   - **飞书应用**: 从 [飞书开放平台](https://open.feishu.cn) 创建并获取 App ID、App Secret、Verification Token

#### 可选配置（推荐）
4. **Moonshot Kimi API Key**: 从 [platform.moonshot.cn](https://platform.moonshot.cn) 获取（新用户有免费额度，优先使用）

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

   **必需密钥**:
   ```bash
   npx wrangler secret put ZAI_API_KEY     # 智谱 AI Key（备用模型）
   ```

   **Telegram Bot 配置** (如果使用 Telegram):
   ```bash
   npx wrangler secret put TELEGRAM_TOKEN  # Telegram Bot Token
   ```

   **飞书 Bot 配置** (如果使用飞书):
   ```bash
   npx wrangler secret put FEISHU_APP_ID              # 飞书应用 ID
   npx wrangler secret put FEISHU_APP_SECRET          # 飞书应用密钥
   npx wrangler secret put FEISHU_VERIFICATION_TOKEN  # 飞书验证令牌
   ```

   **可选配置** (推荐):
   ```bash
   npx wrangler secret put MOONSHOT_API_KEY  # Kimi K2.5 API Key（优先使用）
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **配置 Webhook**

   **Telegram Bot** (如果使用):
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>/webhook"
   ```

   **飞书 Bot** (如果使用):
   1. 进入[飞书开放平台](https://open.feishu.cn) → 你的应用
   2. 前往 **"事件订阅"** 页面
   3. 设置请求地址: `https://<YOUR_WORKER_URL>/feishu`
   4. **重要**: 暂时不要启用加密（Encrypt Key 留空），验证通过后再考虑
   5. 订阅事件: 选择 `im.message.receive_v1` (接收消息)
   6. 发布应用版本并启用机器人功能

## 📝 使用方法

### Telegram
- **普通聊天**: 直接给机器人发消息即可。
- **获取简报**: 发送 `/news`，等待约 5-10 秒。

### 飞书
- **单聊**: 直接给机器人发消息。
- **群聊**: @机器人 发送消息。
- **获取简报**: 发送 `/news`。

## 🤖 AI 模型说明

OpenClaw 采用 **智能降级机制**：

1. **优先使用** Moonshot Kimi K2.5 (moonshot-v1-8k)
   - 如果设置了 `MOONSHOT_API_KEY`，优先调用 Kimi
   - 新用户注册可获免费测试额度

2. **自动降级** 到智谱 GLM-4 Flash (glm-4-flash)
   - 当 Kimi 调用失败时（网络错误、配额耗尽、认证失败等）
   - 自动切换到智谱 AI 作为备用模型
   - 确保服务稳定性

3. **降级触发条件**:
   - HTTP 429 (配额用尽)
   - HTTP 401/403 (认证失败)
   - HTTP 5xx (服务器错误)
   - 网络超时/连接失败

## 🌐 自定义域名（可选）

如果你在国内环境，`*.workers.dev` 可能无法访问，可以在 Cloudflare 绑定自定义域名：

1. 在 Cloudflare Dashboard 进入你的 Worker
2. 点击 **"触发器"** (Triggers) → **"自定义域"**
3. 添加你的域名（需要先将域名托管在 Cloudflare）
4. 使用自定义域名配置 Webhook

## 🛠 技术栈

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Language**: TypeScript
- **AI Models**:
  - Moonshot Kimi K2.5 (moonshot-v1-8k) - 主模型
  - Zhipu GLM-4 Flash (glm-4-flash) - 备用模型
- **Platforms**: Telegram Bot API + 飞书开放平台

## 📄 License

MIT
