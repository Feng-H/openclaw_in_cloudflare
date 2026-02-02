import { callAI } from './ai';
import { fetchAllAIUpdates, fetchTechBlogUpdates } from './news';
import { getClaudeCodeIntel } from './claudecode';

export async function handleUserMessage(
  userText: string,
  reply: (text: string) => Promise<void>,
  env: { MOONSHOT_API_KEY?: string; ZAI_API_KEY: string; NVIDIA_API_KEY?: string; NVIDIA_MODEL?: string }
): Promise<void> {
  // 简单的文本清理
  const command = userText.trim().split(' ')[0].toLowerCase();

  if (command === '/news') {
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

  } else if (command === '/ok') {
    // === 新增: Tech Blog Reading List ===
    await reply("👓 正在阅读技术博客 (Simon Willison, Krebs, Daring Fireball, etc)...");

    // 1. 获取数据
    const newsRaw = await fetchTechBlogUpdates();

    // 2. 构建 Prompt
    const systemPrompt = `
你是一个资深的技术专家和黑客文化爱好者。请阅读以下来自顶级技术博客（如 Simon Willison, Krebs on Security, Jeff Geerling 等）的最新文章列表。

请为我生成一份【技术阅读推荐清单】。

要求：
1. **筛选精华**：不要罗列所有文章，只挑选最具"黑客精神"、"工程洞察"或"安全警示"价值的内容。
2. **分类展示**：
   - 🛡️ 安全与隐私 (Security & Privacy)
   - 🛠️ 工程与折腾 (Engineering & Hacking)
   - 💭 观点与洞察 (Thoughts & Insights)
3. **格式要求**：
   - [Emoji] **文章标题** (作者/来源)
   - > 一句话中文毒舌辣评或深度摘要。告诉我不读这篇文章我会错过什么。
   - [原文链接]
4. **结尾**：用一句富有哲理或极客幽默的话作为结语。

如果数据为空，请输出"博主们都去度假了，暂无更新"。
`;

    // 3. 调用 AI
    const aiResponse = await callAI(`Raw Blog Data:\n${newsRaw}`, env, systemPrompt);

    // 4. 发送回复
    await reply(aiResponse);

  } else if (command === '/claudecode') {
    // === 新增: Claude Code 情报 ===
    await reply("🤖 正在潜入 GitHub 和 Twitter 侦察 Claude Code 的最新情报...");

    try {
      // 1. 调用 claudecode 模块获取 AI 生成的报告
      // 注意：这里需要传入 env，因为需要调用 NVIDIA/Kimi 模型
      const report = await getClaudeCodeIntel({
        ZAI_API_KEY: env.ZAI_API_KEY,
        NVIDIA_API_KEY: env.NVIDIA_API_KEY,
        MOONSHOT_API_KEY: env.MOONSHOT_API_KEY
      });

      // 2. 发送报告
      await reply(report);

    } catch (error: any) {
      console.error('Claude Code Intel Error:', error);
      await reply(`❌ 侦察任务失败: ${error.message}`);
    }

  } else {
    // --- 普通聊天逻辑 ---
    // 暂时没有上下文记忆，直接回复
    const aiResponse = await callAI(userText, env);
    await reply(aiResponse);
  }
}
