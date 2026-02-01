
interface AIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
    type?: string;
  };
}

interface AIEnv {
  MOONSHOT_API_KEY?: string;
  ZAI_API_KEY: string;
}

/**
 * 智能 AI 调用入口
 * 优先使用 Kimi K2.5，失败时自动降级到智谱 AI
 */
export async function callAI(
  prompt: string,
  env: AIEnv,
  systemPrompt?: string
): Promise<string> {

  // 策略1: 优先使用 Kimi K2.5（如果配置了密钥）
  if (env.MOONSHOT_API_KEY) {
    console.log('[AI] 尝试使用 Kimi K2.5 (主模型)');

    try {
      const result = await callKimi(prompt, env.MOONSHOT_API_KEY, systemPrompt);
      console.log('[AI] ✓ Kimi 响应成功');
      return result;

    } catch (error: any) {
      console.error('[AI] ✗ Kimi 调用失败:', {
        message: error.message,
        status: error.status
      });

      // 判断是否需要降级
      if (shouldFallback(error)) {
        console.warn('[AI] → 降级到智谱 AI (备用模型)');
        // 继续执行到智谱 AI 逻辑
      } else {
        // 不可恢复的错误（如 prompt 格式错误），直接返回
        return `Kimi 错误: ${error.message}`;
      }
    }
  }

  // 策略2: 使用智谱 AI（作为备用或默认）
  console.log('[AI] 使用智谱 AI (备用/默认模型)');

  try {
    const result = await callZhipu(prompt, env.ZAI_API_KEY, systemPrompt);
    console.log('[AI] ✓ 智谱 AI 响应成功');
    return result;

  } catch (error: any) {
    console.error('[AI] ✗ 智谱 AI 也失败了:', error);
    return `AI 服务暂时不可用: ${error.message}`;
  }
}

/**
 * 调用 Kimi K2.5 (Moonshot AI)
 */
async function callKimi(
  prompt: string,
  apiKey: string,
  systemPrompt?: string
): Promise<string> {

  const url = 'https://api.moonshot.cn/v1/chat/completions';

  const messages = systemPrompt
    ? [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    : [{ role: 'user', content: prompt }];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(`Kimi API 错误: ${response.status}`);
    error.status = response.status;
    error.details = errorText;
    throw error;
  }

  const data = await response.json() as AIResponse;

  if (data.error) {
    const error: any = new Error(data.error.message);
    error.type = data.error.type;
    throw error;
  }

  return data.choices[0]?.message?.content || '未收到 Kimi 的回复';
}

/**
 * 调用智谱 AI GLM-4-Flash
 */
async function callZhipu(
  prompt: string,
  apiKey: string,
  systemPrompt?: string
): Promise<string> {

  const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  const messages = systemPrompt
    ? [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    : [
        { role: 'system', content: 'You are a helpful assistant powered by ZAI.' },
        { role: 'user', content: prompt }
      ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`智谱 API 错误: ${response.status}`, errorText);
    return `AI Error (${response.status}): ${errorText}`;
  }

  const data = await response.json() as AIResponse;

  if (data.error) {
    console.error('智谱 API 返回错误:', data.error);
    return `AI Error: ${data.error.message}`;
  }

  return data.choices[0]?.message?.content || "未收到 AI 的回复";
}

/**
 * 判断是否应该降级到备用模型
 *
 * 降级条件：
 * - HTTP 429 (配额用尽)
 * - HTTP 401/403 (认证失败)
 * - HTTP 5xx (服务器错误)
 * - 网络错误
 */
function shouldFallback(error: any): boolean {
  // 基于 HTTP 状态码判断
  if (error.status) {
    return [
      429,  // 配额用尽
      401,  // 认证失败
      403,  // 权限不足
      500,  // 服务器内部错误
      502,  // 网关错误
      503,  // 服务不可用
      504   // 网关超时
    ].includes(error.status);
  }

  // 网络错误（fetch 抛出的异常）
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return true;
  }

  // 默认不降级（可能是业务逻辑错误，两个模型都会失败）
  return false;
}
