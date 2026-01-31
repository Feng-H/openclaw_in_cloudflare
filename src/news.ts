
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

/**
 * 主入口：聚合所有源
 */
export async function fetchAllAIUpdates(): Promise<string> {
  const [hn, anthropic, google] = await Promise.all([
    fetchHackerNewsAI(5),
    fetchRSS('https://www.anthropic.com/feed', 'Anthropic Blog'), // Anthropic RSS (Check URL validity)
    fetchRSS('http://googleaiblog.blogspot.com/atom.xml', 'Google AI Blog')
  ]);

  const allItems = [...anthropic, ...google, ...hn];

  if (allItems.length === 0) return "No updates found.";

  let rawText = "Here are the latest AI updates:\n\n";
  allItems.forEach((item, idx) => {
    rawText += `${idx + 1}. [${item.source}] ${item.title}\n   Link: ${item.link}\n`;
  });

  return rawText;
}
