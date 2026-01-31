# OpenClaw Project Guide

OpenClaw is a serverless Telegram Bot Agent deployed on Cloudflare Workers, powered by Zhipu AI (GLM-4 Flash). It serves as an intelligent assistant and an automated AI news aggregator.

## 🏗 Architecture
- **Platform**: Cloudflare Workers (Hono framework)
- **Language**: TypeScript
- **AI Provider**: Zhipu AI (GLM-4 Flash) via OpenAI-compatible API
- **Data Sources**: Hacker News API, GitHub Search API (Trending), Anthropic Blog RSS, Google AI Blog RSS

### File Structure
- `src/index.ts`: Entry point. Handles Webhook routing and command dispatch (`/news`).
- `src/ai.ts`: AI client wrapper. Handles communication with Zhipu AI.
- `src/news.ts`: Data fetching logic. Aggregates RSS feeds and GitHub API data.
- `src/telegram.ts`: Utilities for sending messages to Telegram.

## 🛠 Common Commands

### Development & Deployment
- **Install Dependencies**: `npm install`
- **Local Dev Server**: `npm run dev` (Starts local wrangler server)
- **Deploy to Production**: `npm run deploy`
- **View Live Logs**: `npx wrangler tail`

### Configuration (Secrets)
Set these using `npx wrangler secret put <KEY>`:
- `TELEGRAM_TOKEN`: Bot token from @BotFather.
- `ZAI_API_KEY`: API Key from Zhipu AI (bigmodel.cn).
- `ZAI_API_BASE_URL`: (Optional) Custom base URL if not hardcoded.

### Telegram Webhook Setup
After deployment, connect your bot to the worker:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>/webhook"
```

## 🤖 Bot Commands
- `/start` or text message: Chat with AI (Context-free).
- `/news`: Triggers the "AI Daily Observation" briefing.
    - Fetches top AI stories from Hacker News.
    - Fetches latest updates from Anthropic & Google AI blogs.
    - Generates a structured Chinese summary using AI.

## 📝 Style Guidelines
- **Code**: TypeScript strict mode. Prefer `async/await`.
- **Error Handling**: Catch errors at the top level (`index.ts`) or service boundaries (`news.ts`) to prevent worker crashes.
- **AI Prompts**: Keep system prompts in `src/index.ts` or dedicated prompt files. Use Chinese for final output instructions.

## 🚀 Future Roadmap
- [ ] **Scheduled Push**: Use Cloudflare Cron Triggers to send `/news` automatically every morning.
- [ ] **Memory**: Implement Cloudflare D1 or KV to store user chat context.
- [ ] **Multi-turn Chat**: Support replying to previous messages.
- [ ] **Image Analysis**: Upgrade to GLM-4V for image understanding.

## 🔍 Debugging Tips
If the bot doesn't reply:
1. Check `npx wrangler tail` for errors.
2. Verify `TELEGRAM_TOKEN` and `ZAI_API_KEY` are set.
3. If receiving "Too Many Requests", switch model to `glm-4-flash` in `src/ai.ts`.
