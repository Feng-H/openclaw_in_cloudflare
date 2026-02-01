import { callAI } from './ai';
import { fetchAllAIUpdates } from './news';

export async function handleUserMessage(
  userText: string,
  reply: (text: string) => Promise<void>,
  env: { MOONSHOT_API_KEY?: string; ZAI_API_KEY: string }
): Promise<void> {
  // 简单的文本清理 (例如去除 @botname，如果需要的话)
  // 这里暂时直接处理

  if (userText.startsWith('/news')) {
    // 1. 提示用户正在处理
    await reply("🕵️ 正在全网搜罗 AI 情报 (Anthropic, Google, HN)...");

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
(如果没有相关数据，请写"无重大热点")
- [emoji] 中文标题 (原文链接)
  > 一句话深度解读

## 🟣 Claude 最新动态
(基于 Anthropic Blog 数据，如果没有则写"暂无官方更新")
- [emoji] 中文标题 (原文链接)

## 🔵 Gemini 最新动态
(基于 Google AI Blog 数据，如果没有则写"暂无官方更新")
- [emoji] 中文标题 (原文链接)

## 💡 总结
(用一句幽默的话总结今天的 AI 圈)
`;
    const aiResponse = await callAI(`Raw Data:\n${newsRaw}`, env, systemPrompt);

    // 4. 发送结果
    await reply(aiResponse);

  } else {
    // --- 普通聊天逻辑 ---
    // 暂时没有上下文记忆，直接回复
    const aiResponse = await callAI(userText, env);
    await reply(aiResponse);
  }
}
