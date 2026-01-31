import { Hono } from 'hono';
import { TelegramUpdate, sendMessage } from './telegram';
import { callZAI } from './ai';
import { fetchAllAIUpdates } from './news';

type Bindings = {
  TELEGRAM_TOKEN: string;
  ZAI_API_KEY: string;
  ZAI_API_BASE_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Health check
app.get('/', (c) => c.text('OpenClaw Bot is running! 🦞'));

// Webhook handler
app.post('/webhook', async (c) => {
  const token = c.env.TELEGRAM_TOKEN;
  const zaiKey = c.env.ZAI_API_KEY;

  if (!token || !zaiKey) {
    console.error('Missing environment variables');
    return c.text('Configuration Error', 500);
  }

  try {
    const update: TelegramUpdate = await c.req.json();

    if (update.message && update.message.text && update.message.chat) {
      const chatId = update.message.chat.id;
      const userText = update.message.text.trim();

      console.log(`Received message from ${chatId}: ${userText}`);

      // --- 升级后的命令处理逻辑 ---
      if (userText === '/news') {
        // 1. 提示用户正在处理
        await sendMessage(chatId, "🕵️ 正在全网搜罗 AI 情报 (Anthropic, Google, HN)...", token);

        // 2. 抓取多源数据
        const newsRaw = await fetchAllAIUpdates();

        // 3. 构建 Prompt 让 AI 总结
        const systemPrompt = `
你是一个专业的 AI 行业分析师。请根据我提供的多源数据，生成一份【AI 每日观察简报】。
数据中包含了 Hacker News 的热门讨论、Anthropic 官方博客、Google AI 官方博客的更新，以及 GitHub 上近期最火的 AI 开源项目（Trending）。

请严格按照以下格式输出：

## 🚀 GitHub 霸榜项目 (本周新星)
(基于 GitHub Trending 数据，挑选最有趣的)
- ⭐️ [项目名] (Star数)
  > 一句话毒舌点评：这个项目是干嘛的？为什么火？

## 🚨 行业热点 (精选自 Hacker News)
(如果没有相关数据，请写“无重大热点”)
- [emoji] 中文标题 (原文链接)
  > 一句话深度解读

## 🟣 Claude 最新动态
(基于 Anthropic Blog 数据，如果没有则写“暂无官方更新”)
- [emoji] 中文标题 (原文链接)

## 🔵 Gemini 最新动态
(基于 Google AI Blog 数据，如果没有则写“暂无官方更新”)
- [emoji] 中文标题 (原文链接)

## 💡 总结
(用一句幽默的话总结今天的 AI 圈)
`;
        const aiResponse = await callZAI(`${systemPrompt}\n\nRaw Data:\n${newsRaw}`, zaiKey);

        // 4. 发送结果
        await sendMessage(chatId, aiResponse, token);

      } else {
        // --- 原有：普通聊天逻辑 ---
        const aiResponse = await callZAI(userText, zaiKey);
        await sendMessage(chatId, aiResponse, token);
      }
    }

    return c.text('OK');
  } catch (err) {
    console.error('Error processing webhook:', err);
    return c.text('Internal Server Error', 500);
  }
});

export default app;
