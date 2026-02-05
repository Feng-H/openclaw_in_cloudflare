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
- **🏠 NAS 原生支持**: 特别适配飞牛 NAS (FnOS) 等私有云环境，一键脚本安装。

## 🚀 快速部署

### 方式一：一键安装 (推荐 NAS 用户)

适用于 Linux、macOS 以及飞牛 NAS (FnOS) 环境。无需 Docker，无需配置环境，直接运行。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

安装脚本引导内容：
1. 自动检测环境。
2. 配置 AI 密钥 (Zhipu AI Key)。
3. 配置消息平台 (飞书/Telegram)。
4. 自动启动服务。

**飞牛 NAS 用户特别指南**：
如果要在飞牛 NAS 上部署并通过本地电脑访问，请参考详细指南：[飞牛NAS部署手册](./openclaw_in_fnNAS.md)

### 方式二：Cloudflare Workers 部署 (Serverless)

适合没有服务器，希望完全免费托管的用户。

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
   # AI 密钥
   npx wrangler secret put ZAI_API_KEY      # 智谱 AI Key (必需)
   npx wrangler secret put MOONSHOT_API_KEY # Kimi AI Key (可选，推荐)

   # 平台配置 (选填)
   npx wrangler secret put TELEGRAM_TOKEN
   npx wrangler secret put FEISHU_APP_ID
   npx wrangler secret put FEISHU_APP_SECRET
   npx wrangler secret put FEISHU_VERIFICATION_TOKEN
   ```

4. **部署到 Cloudflare**
   ```bash
   npm run deploy
   ```

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
2. **自动降级** 到智谱 GLM-4 Flash (glm-4-flash)
   - 当 Kimi 调用失败时（网络错误、配额耗尽、认证失败等）
   - 自动切换到智谱 AI 作为备用模型
   - 确保服务稳定性

## 📄 License

MIT
