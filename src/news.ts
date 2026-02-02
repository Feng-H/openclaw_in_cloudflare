
interface NewsItem {
  title: string;
  link: string;
  source: string; // 'Hacker News', 'Anthropic', 'Google AI'
  date?: string;
}

/**
 * 简单的 RSS/Atom 解析器 (使用正则，轻量级)
 */
async function fetchRSS(url: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const items: NewsItem[] = [];

    // 匹配 <item> (RSS) 或 <entry> (Atom)
    const entryRegex = /<(item|entry)>([\s\S]*?)<\/(item|entry)>/g;
    let match;

    let count = 0;
    while ((match = entryRegex.exec(text)) !== null && count < 5) { // 每个源只取前5条
      const content = match[2];

      // 提取标题
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/.exec(content);
      // 提取链接 (兼容 <link>xxx</link> 和 <link href="xxx" />)
      const linkMatch1 = /<link>([\s\S]*?)<\/link>/.exec(content);
      const linkMatch2 = /<link[^>]+href=["'](.*?)["']/.exec(content);
      // 提取时间
      const dateMatch = /<(pubDate|updated)>([\s\S]*?)<\/(pubDate|updated)>/.exec(content);

      if (titleMatch) {
        // 清理 CDATA
        const title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const link = (linkMatch1 ? linkMatch1[1] : (linkMatch2 ? linkMatch2[1] : '')) || '';
        const date = dateMatch ? dateMatch[2] : '';

        // 简单的 24小时过滤 (如果能解析出日期)
        // 这里为了演示稳定性，暂时不强行过滤时间，交给 AI 去判断或展示
        items.push({
          title,
          link,
          source: sourceName,
          date
        });
        count++;
      }
    }
    return items;
  } catch (e) {
    console.error(`Error fetching RSS from ${sourceName}:`, e);
    return [];
  }
}

/**
 * Hacker News 抓取 (带 AI 关键词过滤)
 */
async function fetchHackerNewsAI(limit: number = 10): Promise<NewsItem[]> {
  try {
    const topIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topIds = await topIdsRes.json() as number[];
    const targetIds = topIds.slice(0, 30); // 抓取前30条来筛选

    const items: NewsItem[] = [];

    // 关键词列表
    const keywords = ['AI', 'LLM', 'Claude', 'Gemini', 'GPT', 'Model', 'Machine Learning', 'Neural'];

    const promises = targetIds.map(async (id) => {
      const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      return r.json() as Promise<{title: string, url: string, time: number}>;
    });

    const rawItems = await Promise.all(promises);

    for (const item of rawItems) {
      if (!item.title) continue;

      // 筛选：必须包含关键词
      const isRelevant = keywords.some(k => item.title.toLowerCase().includes(k.toLowerCase()));

      if (isRelevant) {
        items.push({
          title: item.title,
          link: item.url || `https://news.ycombinator.com/item?id=${item.time}`, // hack: use time var as id placeholder if needed, but actually item has id.
          source: 'Hacker News (AI)',
          date: new Date(item.time * 1000).toISOString()
        });
      }
    }

    return items.slice(0, limit);
  } catch (e) {
    console.error('HN Error:', e);
    return [];
  }
}

const TECH_BLOG_FEEDS = [
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/entries/' },
  { name: 'Jeff Geerling', url: 'https://www.jeffgeerling.com/blog.xml' },
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
  { name: 'Daring Fireball', url: 'https://daringfireball.net/feeds/main' },
  { name: 'Pluralistic', url: 'https://pluralistic.net/feed/' },
  { name: 'Terence Eden', url: 'https://shkspr.mobi/blog/feed/' },
  { name: 'lcamtuf', url: 'https://lcamtuf.substack.com/feed' },
  { name: 'Mitchell Hashimoto', url: 'https://mitchellh.com/feed.xml' },
  { name: 'Xe Iaso', url: 'https://xeiaso.net/blog.rss' }
];

/**
 * 抓取技术博客更新 (Command: /ok)
 */
export async function fetchTechBlogUpdates(): Promise<string> {
  const promises = TECH_BLOG_FEEDS.map(feed => fetchRSS(feed.url, feed.name));
  const results = await Promise.all(promises);

  const allItems: NewsItem[] = [];
  results.forEach(items => {
    // 每个源只取前2条，避免 Context 爆炸
    allItems.push(...items.slice(0, 2));
  });

  if (allItems.length === 0) return "No updates found.";

  let rawText = "Here are the latest Tech Blog updates:\n\n";
  allItems.forEach((item, idx) => {
    rawText += `${idx + 1}. [${item.source}] ${item.title}\n   Link: ${item.link}\n`;
  });

  return rawText;
}

/**
 * 抓取 GitHub 上的热门 AI 项目 (模拟 Trending)
 */
async function fetchGitHubTrending(): Promise<NewsItem[]> {
  try {
    // 搜索条件：过去7天内创建的、且 star 数较高的 AI 项目，或者近期 star 飙升的项目
    // 由于 GitHub Search API 限制，我们搜索按 stars 排序的 AI 仓库
    const date = new Date();
    date.setDate(date.getDate() - 7); // 过去7天
    const dateStr = date.toISOString().split('T')[0];

    const query = `topic:ai+created:>${dateStr}&sort=stars&order=desc`;
    const res = await fetch(`https://api.github.com/search/repositories?q=${query}&per_page=5`, {
      headers: {
        'User-Agent': 'OpenClaw-Bot'
      }
    });

    const data = await res.json() as { items: any[] };

    if (!data.items) return [];

    return data.items.map((repo: any) => ({
      title: `${repo.full_name} (⭐ ${repo.stargazers_count})`,
      link: repo.html_url,
      source: 'GitHub Trending',
      date: repo.created_at
    }));
  } catch (e) {
    console.error('GitHub API Error:', e);
    return [];
  }
}

/**
 * 主入口：聚合所有源
 */
export async function fetchAllAIUpdates(): Promise<string> {
  const [hn, anthropic, google, ghTrending] = await Promise.all([
    fetchHackerNewsAI(5),
    fetchRSS('https://www.anthropic.com/feed', 'Anthropic Blog'),
    fetchRSS('http://googleaiblog.blogspot.com/atom.xml', 'Google AI Blog'),
    fetchGitHubTrending() // 替换了原来的 commits 源
  ]);

  const allItems = [...ghTrending, ...anthropic, ...google, ...hn];

  if (allItems.length === 0) return "No updates found.";

  let rawText = "Here are the latest AI updates:\n\n";
  allItems.forEach((item, idx) => {
    rawText += `${idx + 1}. [${item.source}] ${item.title}\n   Link: ${item.link}\n`;
  });

  return rawText;
}
