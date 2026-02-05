import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { TelegramUpdate, sendMessage } from './telegram';
import { handleUserMessage } from './core';
import { FeishuEvent, sendFeishuMessage } from './feishu';

type Bindings = {
  TELEGRAM_TOKEN: string;
  ZAI_API_KEY: string;
  ZAI_API_BASE_URL?: string;
  MOONSHOT_API_KEY?: string;  // Kimi K2.5 API 密钥
  NVIDIA_API_KEY?: string;    // NVIDIA API Key
  NVIDIA_MODEL?: string;      // NVIDIA 模型 ID (可选)
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  FEISHU_VERIFICATION_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// Health check
app.get('/', (c) => c.text('OpenClaw Bot is running! 🦞'));

// Telegram Webhook
app.post('/webhook', async (c) => {
  const token = c.env.TELEGRAM_TOKEN;
  const zaiKey = c.env.ZAI_API_KEY;
  const moonshotKey = c.env.MOONSHOT_API_KEY;
  const nvidiaKey = c.env.NVIDIA_API_KEY;
  const nvidiaModel = c.env.NVIDIA_MODEL;

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

      const envConfig = {
        MOONSHOT_API_KEY: moonshotKey,
        ZAI_API_KEY: zaiKey,
        NVIDIA_API_KEY: nvidiaKey,
        NVIDIA_MODEL: nvidiaModel
      };

      if (c.executionCtx) {
          c.executionCtx.waitUntil(handleUserMessage(userText, reply, envConfig));
      } else {
          await handleUserMessage(userText, reply, envConfig);
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

      // 1. URL Verification (Challenge)
      if (body.type === 'url_verification') {
         console.log('[Feishu] URL verification challenge received');
         return c.json({ challenge: body.challenge });
      }

      // 2. 配置检查
      const appId = c.env.FEISHU_APP_ID;
      const appSecret = c.env.FEISHU_APP_SECRET;
      const zaiKey = c.env.ZAI_API_KEY;
      const moonshotKey = c.env.MOONSHOT_API_KEY;
      const nvidiaKey = c.env.NVIDIA_API_KEY;
      const nvidiaModel = c.env.NVIDIA_MODEL;
      const verificationToken = c.env.FEISHU_VERIFICATION_TOKEN;

      if (!appId || !appSecret || !zaiKey) {
         console.error('Missing Feishu/AI config');
         return c.json({ code: 1, msg: "Config missing" });
      }

      // 3. Token 验证
      if (verificationToken && body.header?.token && body.header.token !== verificationToken) {
          console.warn('Invalid verification token');
          return c.json({ error: 'Invalid token' }, 403);
      }

      if (body.header.event_type === 'im.message.receive_v1' && body.event?.message) {
          const msg = body.event.message;
          const chatId = msg.chat_id;

          let text = "";
          try {
            const contentObj = JSON.parse(msg.content);
            text = contentObj.text || "";
          } catch (e) {
            console.error("Failed to parse Feishu content:", e);
          }

          if (text) {
            console.log(`Received Feishu message: ${text}`);

            const reply = async (responseStart: string) => {
                 await sendFeishuMessage(chatId, responseStart, appId, appSecret, 'chat_id');
            };

            const envConfig = {
              MOONSHOT_API_KEY: moonshotKey,
              ZAI_API_KEY: zaiKey,
              NVIDIA_API_KEY: nvidiaKey,
              NVIDIA_MODEL: nvidiaModel
            };

            if (c.executionCtx) {
                c.executionCtx.waitUntil(handleUserMessage(text, reply, envConfig));
            } else {
                await handleUserMessage(text, reply, envConfig);
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
