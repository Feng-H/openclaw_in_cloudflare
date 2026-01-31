
interface ZaiResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

/**
 * Call the ZAI API (assumed OpenAI-compatible or specific ZAI endpoint)
 * Adjust the endpoint URL and payload structure if ZAI differs from standard OpenAI format.
 */
export async function callZAI(prompt: string, apiKey: string, baseUrl: string = 'https://open.bigmodel.cn/api/paas/v4'): Promise<string> {
  // 直接使用智谱官方 endpoint，避免环境变量配置错误
  const url = `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash', // 切换为 Flash 模型，速度快且通常免费/便宜
        messages: [
          { role: 'system', content: 'You are a helpful assistant powered by ZAI.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ZAI API Error: ${response.status}`, errorText);
      // 将完整的错误信息返回给用户，以便排查
      return `AI Error (${response.status}): ${errorText}`;
    }

    const data = await response.json() as ZaiResponse;

    if (data.error) {
       console.error('ZAI API returned error:', data.error);
       return `AI Error: ${data.error.message}`;
    }

    return data.choices[0]?.message?.content || "No response from AI.";

  } catch (error) {
    console.error('Network or parsing error calling ZAI:', error);
    return "Failed to connect to AI service.";
  }
}
