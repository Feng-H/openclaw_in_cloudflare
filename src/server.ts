import { serve } from '@hono/node-server';
import 'dotenv/config';
import app from './index';

const port = Number(process.env.PORT) || 3000;

console.log(`Server is running on port ${port}`);

serve({
  fetch: (req) => {
    // 将 process.env 注入到 Hono 的 env 中，以便 src/index.ts 可以通过 c.env 访问
    return app.fetch(req, process.env);
  },
  port
});
