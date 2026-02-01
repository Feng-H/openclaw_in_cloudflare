import { Hono } from 'hono';
import { TelegramUpdate, sendMessage } from './telegram';
import { handleUserMessage } from './core';
import { FeishuEvent, sendFeishuMessage } from './feishu';

type Bindings = {
  TELEGRAM_TOKEN: string;
  ZAI_API_KEY: string;
  ZAI_API_BASE_URL?: string;
  MOONSHOT_API_KEY?: string;  // Kimi K2.5 API 密钥（可选，用于智能降级）
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  FEISHU_VERIFICATION_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Health check
app.get('/', (c) => c.text('OpenClaw Bot is running! 🦞'));

// Telegram Webhook
app.post('/webhook', async (c) => {
  const token = c.env.TELEGRAM_TOKEN;
  const zaiKey = c.env.ZAI_API_KEY;
  const moonshotKey = c.env.MOONSHOT_API_KEY;

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

      const reply = async (text: string) => {
        await sendMessage(chatId, text, token);
      };

      // 使用 Cloudflare Workers 的 waitUntil 来避免等待，防止超时（虽然Telegram可以等，但最好快点响应）
      // 注意：如果需要流式或长时间运行，最好使用 Queue 或 waitUntil
      // 这里我们为了简单，直接 await，因为 Cloudflare Workers 默认有一定超时时间
      // 但对于 /news 这种长任务，最好用 waitUntil

      if (c.executionCtx) {
          c.executionCtx.waitUntil(handleUserMessage(userText, reply, {
            MOONSHOT_API_KEY: moonshotKey,
            ZAI_API_KEY: zaiKey
          }));
      } else {
          await handleUserMessage(userText, reply, {
            MOONSHOT_API_KEY: moonshotKey,
            ZAI_API_KEY: zaiKey
          });
      }
    }

    return c.text('OK');
  } catch (err) {
    console.error('Error processing webhook:', err);
    return c.text('Internal Server Error', 500);
  }
});

// Feishu Webhook
app.post('/feishu', async (c) => {
    try {
      const body = await c.req.json() as FeishuEvent;

      // 1. URL Verification (Challenge) - 优先处理，无需配置检查
      if (body.type === 'url_verification') {
         console.log('[Feishu] URL verification challenge received');
         return c.json({ challenge: body.challenge });
      }

      // 2. 配置检查 - 仅在处理实际事件时需要
      const appId = c.env.FEISHU_APP_ID;
      const appSecret = c.env.FEISHU_APP_SECRET;
      const zaiKey = c.env.ZAI_API_KEY;
      const moonshotKey = c.env.MOONSHOT_API_KEY;
      const verificationToken = c.env.FEISHU_VERIFICATION_TOKEN;

      if (!appId || !appSecret || !zaiKey) {
         console.error('Missing Feishu/AI config');
         return c.json({ code: 1, msg: "Config missing" });
      }

      // 2. Event Handling - 可选的 token 验证
      if (verificationToken && body.header?.token && body.header.token !== verificationToken) {
          console.warn('Invalid verification token');
          return c.json({ error: 'Invalid token' }, 403);
      }

      if (body.header.event_type === 'im.message.receive_v1' && body.event?.message) {
          const msg = body.event.message;
          const chatId = msg.chat_id;

          // 解析内容
          // 飞书文本消息 content 是 JSON 字符串 "{\"text\":\"...\"}"
          let text = "";
          try {
            const contentObj = JSON.parse(msg.content);
            text = contentObj.text || "";
          } catch (e) {
            console.error("Failed to parse Feishu content:", e);
          }

          // 简单的去重/处理：飞书Bot如果接收到自己发的消息（通常不会，但以防万一）
          // 另外，飞书@机器人时，消息内容可能包含 @Key
          // 这里简单处理，直接传给 core

          if (text) {
            console.log(`Received Feishu message: ${text}`);

            const reply = async (responseStart: string) => {
                 await sendFeishuMessage(chatId, responseStart, appId, appSecret, 'chat_id');
            };

            if (c.executionCtx) {
                c.executionCtx.waitUntil(handleUserMessage(text, reply, {
                  MOONSHOT_API_KEY: moonshotKey,
                  ZAI_API_KEY: zaiKey
                }));
            } else {
                await handleUserMessage(text, reply, {
                  MOONSHOT_API_KEY: moonshotKey,
                  ZAI_API_KEY: zaiKey
                });
            }
          }
      }

      return c.json({ code: 0, msg: "success" });
    } catch (err) {
      console.error('Feishu Error:', err);
      return c.json({ code: 1, msg: "Internal Error" });
    }
  });

export default app;
