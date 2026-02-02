
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
  ZAI_API_KEY: string;
  NVIDIA_API_KEY?: string;
  NVIDIA_MODEL?: string; // 允许用户自定义 NVIDIA 模型 ID
  MOONSHOT_API_KEY?: string; // Kimi 官方 API
}

/**
 * 智能 AI 调用入口
 * 优先级: Kimi (Moonshot) > NVIDIA NIM > 智谱 AI (兜底)
 */
export async function callAI(
  prompt: string,
  env: AIEnv,
  systemPrompt?: string
): Promise<string> {

  // 1. 优先尝试 Moonshot AI (Kimi 官方)
  if (env.MOONSHOT_API_KEY) {
    console.log('[AI] 尝试使用 Moonshot AI (Kimi)');
    try {
      const result = await callMoonshot(prompt, env.MOONSHOT_API_KEY, systemPrompt);
      console.log('[AI] ✓ Moonshot AI 响应成功');
      return result;
    } catch (error: any) {
      console.error('[AI] ✗ Moonshot AI 调用失败，尝试降级:', error.message);
    }
  }

  // 2. 尝试使用 NVIDIA NIM
  if (env.NVIDIA_API_KEY) {
    const model = env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';
    console.log(`[AI] 尝试使用 NVIDIA NIM (${model})`);
    try {
      const result = await callNvidia(prompt, env.NVIDIA_API_KEY, model, systemPrompt);
      console.log('[AI] ✓ NVIDIA NIM 响应成功');
      return result;
    } catch (error: any) {
      console.error('[AI] ✗ NVIDIA NIM 调用失败，正在降级到智谱 AI:', error.message);
    }
  }

  // 3. 使用智谱 AI (作为兜底)
  console.log('[AI] 使用智谱 AI (GLM-4-Flash)');

  try {
    const result = await callZhipu(prompt, env.ZAI_API_KEY, systemPrompt);
    console.log('[AI] ✓ 智谱 AI 响应成功');
    return result;

  } catch (error: any) {
    console.error('[AI] ✗ 智谱 AI 调用失败:', error);
    return `AI 服务暂时不可用: ${error.message}`;
  }
}

/**
 * 调用 Moonshot AI (Kimi)
 */
async function callMoonshot(
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
    : [
        { role: 'system', content: 'You are Kimi, a helpful assistant.' },
        { role: 'user', content: prompt }
      ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Moonshot API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as AIResponse;
  return data.choices[0]?.message?.content || "未收到 Kimi 的回复";
}

/**
 * 调用 NVIDIA NIM API
 */
async function callNvidia(
  prompt: string,
  apiKey: string,
  model: string,
  systemPrompt?: string
): Promise<string> {
  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const messages = systemPrompt
    ? [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    : [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages,
      temperature: 0.5,
      top_p: 1,
      max_tokens: 1024,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as AIResponse;

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.choices[0]?.message?.content || "未收到 AI 的回复";
}

/**
 * 调用智谱 AI GLM-4-Flash (免费高速版)
 * 文档: https://open.bigmodel.cn/dev/api#glm-4
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
        { role: 'system', content: 'You are a helpful assistant powered by Zhipu GLM-4.' },
        { role: 'user', content: prompt }
      ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'glm-4-flash', // 更新为免费高速模型，避免 429 余额不足
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
