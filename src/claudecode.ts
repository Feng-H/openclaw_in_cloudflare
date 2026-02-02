import { callAI } from './ai';

interface GitHubRepo {
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
}

interface HNItem {
  title: string;
  url: string;
  points: number;
  author: string;
  created_at: string;
  comment_text?: string;
}

/**
 * 获取 Claude Code 相关情报
 */
export async function getClaudeCodeIntel(
  env: { ZAI_API_KEY: string; NVIDIA_API_KEY?: string; MOONSHOT_API_KEY?: string }
): Promise<string> {

  // 1. 并行抓取数据: GitHub + Hacker News
  const [githubData, hnData] = await Promise.all([
    fetchGitHubTrends(),
    fetchHackerNewsDiscussion()
  ]);

  // 2. 构建 Prompt
  const prompt = `
你是一位精通 Claude Code 的技术情报官。请根据我提供的 **GitHub 实时数据** 和 **Hacker News 最新讨论**，为我生成一份【Claude Code 本周情报】。

🔍 **数据分析任务**:
1. **GitHub**: 分析热门项目，找出开发者正在用 Claude Code 做什么创新。
2. **Hacker News**: 分析社区讨论，总结大家提到的 **使用技巧 (Tips)**、**痛点 (Pain Points)** 或 **隐藏功能**。
3. **Twitter (X)**: 由于 API 限制无法抓取实时推文，请在报告中提供 **Boris Cherny (@bcherny)** 和 **Cat Wu (@_catwu)** 的主页链接，并提示用户点击查看。

---
📊 **GitHub Data (Real-time)**:
${JSON.stringify(githubData, null, 2)}

💬 **Hacker News Discussion (Real-time)**:
${JSON.stringify(hnData, null, 2)}
---

请用中文，按照以下结构输出 Markdown：

# 🤖 Claude Code 本周情报

## 🛠️ 社区新工具 (GitHub)
(挑选 3 个最有意思的项目，如果没有数据则写"暂无")
- **[项目名](链接)** (⭐️ Star数)
  > 一句话介绍：它解决了什么痛点？

## 🔥 社区热议 & 技巧 (Hacker News)
(基于 HN 讨论总结，重点挖掘 **Tips** 和 **使用心得**)
- **话题**: [点击查看讨论](链接)
  > 核心观点/技巧：...

## 🗣️ 开发者动态 (Twitter/X)
(由于 API 限制，以下为直达链接，请点击查看最新官方 Tips)
- 🐦 **Boris Cherny (@bcherny)**: [点击查看主页](https://x.com/bcherny)
  > Claude Code 架构师，常分享 hidden tips。
- 🐦 **Cat Wu (@_catwu)**: [点击查看主页](https://x.com/_catwu)
  > 产品负责人，关注 Roadmap 和用户反馈。

## 💡 极客建议
(结合 HN 讨论和你的知识，给出一个实用的 .clauderc 配置或 Prompt 技巧)
`;

  // 3. 调用 AI 总结
  return await callAI(prompt, env, "You are a tech trend analyst specializing in developer tools.");
}

/**
 * 抓取 GitHub 上关于 claude-code 的热门项目
 */
async function fetchGitHubTrends(): Promise<GitHubRepo[]> {
  const query = "claude-code";
  const url = `https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OpenClaw-Bot'
      }
    });

    if (!response.ok) return [];

    const data: any = await response.json();
    if (!data.items) return [];

    return data.items.slice(0, 5).map((item: any) => ({
      full_name: item.full_name,
      html_url: item.html_url,
      description: item.description || "暂无描述",
      stargazers_count: item.stargazers_count
    }));
  } catch (e) {
    console.error("GitHub fetch failed:", e);
    return [];
  }
}

/**
 * 抓取 Hacker News 上关于 "Claude Code" 的最新讨论
 * 使用 Algolia API
 */
async function fetchHackerNewsDiscussion(): Promise<HNItem[]> {
  // 搜索关键词: "Claude Code" 或 "Anthropic Claude"
  // 限制: 过去 7 天 (created_at_i > now - 7 days)
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - 7 * 24 * 60 * 60;

  const query = "Claude Code";
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${oneWeekAgo}&hitsPerPage=5`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data: any = await response.json();
    if (!data.hits) return [];

    return data.hits.map((item: any) => ({
      title: item.title,
      url: `https://news.ycombinator.com/item?id=${item.objectID}`, // 构造 HN 链接
      points: item.points,
      author: item.author,
      created_at: item.created_at
    }));
  } catch (e) {
    console.error("HN fetch failed:", e);
    return [];
  }
}
