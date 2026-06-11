import axios from 'axios';

const GOLD_QUERY = 'gold price OR gold market OR XAU OR bullion OR "precious metals"';

const GOLD_KEYWORDS =
  /\b(gold|xau|bullion|precious metal|kitco|paxg|pax gold|gold price|gold market|comex|spot gold|gold futures|gold etf)\b/i;

const isDev = import.meta.env.DEV;

const isGoldRelated = (text = '') => GOLD_KEYWORDS.test(text);

const stripHtml = (html = '') =>
  html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** Fetch URL via dev proxy, or public CORS proxy in production */
const fetchProxied = async (targetUrl, options = {}) => {
  const url = isDev
    ? `/api/cors?url=${encodeURIComponent(targetUrl)}`
    : `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

  return axios.get(url, {
    timeout: 15000,
    ...options,
    headers: {
      'User-Agent': 'GoldTraderPro/1.0 (gold market news)',
      ...options.headers
    }
  });
};

const parseRssXml = (xmlText) => {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Failed to parse news feed');

  return Array.from(doc.querySelectorAll('item')).map((item) => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
    const description =
      stripHtml(item.querySelector('description')?.textContent || '') ||
      'Read the latest gold market coverage.';

    return {
      id: link || title,
      title,
      summary: description.slice(0, 280) + (description.length > 280 ? '…' : ''),
      source: item.querySelector('source')?.textContent?.trim() || 'Kitco News',
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      url: link,
      image: null
    };
  });
};

const mapGNewsArticles = (articles = []) =>
  articles
    .filter((a) => isGoldRelated(`${a.title || ''} ${a.description || ''}`))
    .map((a) => ({
      id: a.url || a.title,
      title: a.title,
      summary: a.description || 'Latest gold market update.',
      source: a.source?.name || 'Market News',
      date: a.publishedAt,
      url: a.url,
      image: a.image || null
    }));

export async function fetchFromGNews() {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    q: GOLD_QUERY,
    lang: 'en',
    max: '15',
    sortby: 'publishedAt',
    apikey: apiKey
  });

  const url = isDev
    ? `/api/gnews/search?${params.toString()}`
    : `https://gnews.io/api/v4/search?${params.toString()}`;

  const { data } = await axios.get(url, { timeout: 12000 });
  const mapped = mapGNewsArticles(data.articles || []);
  return mapped.length ? mapped : null;
}

export async function fetchFromKitcoRss() {
  const kitcoUrl = 'https://www.kitco.com/rss/kitconews.xml';

  try {
    if (isDev) {
      const { data: xmlText } = await axios.get('/api/kitco-rss', {
        timeout: 12000,
        responseType: 'text',
        transformResponse: [(r) => r]
      });
      const articles = parseRssXml(xmlText).slice(0, 15);
      return articles.length ? articles : null;
    }
  } catch {
    /* try proxied */
  }

  try {
    const { data: xmlText } = await fetchProxied(kitcoUrl, {
      responseType: 'text',
      transformResponse: [(r) => r]
    });
    if (typeof xmlText === 'string' && xmlText.includes('<item>')) {
      const articles = parseRssXml(xmlText).slice(0, 15);
      return articles.length ? articles : null;
    }
  } catch {
    /* unavailable */
  }

  return null;
}

const parseRedditResponse = (data, requireGoldFilter = false) => {
  const articles = [];

  for (const child of data?.data?.children || []) {
    const post = child?.data;
    if (!post?.title) continue;

    const text = `${post.title} ${post.selftext || ''}`;
    if (requireGoldFilter && !isGoldRelated(text)) continue;

    articles.push({
      id: post.id,
      title: post.title,
      summary:
        stripHtml(post.selftext || '').slice(0, 280) ||
        `Gold market discussion from r/${post.subreddit}.`,
      source: `r/${post.subreddit}`,
      date: new Date(post.created_utc * 1000).toISOString(),
      url: `https://www.reddit.com${post.permalink}`,
      image:
        post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ||
        (post.thumbnail?.startsWith('http') ? post.thumbnail : null)
    });
  }

  return articles;
};

export async function fetchFromRedditGold() {
  const feeds = [
    { path: '/r/Gold/hot.json?limit=12', requireGoldFilter: false },
    { path: '/r/Gold/new.json?limit=10', requireGoldFilter: false },
    { path: '/r/GoldPrice/new.json?limit=8', requireGoldFilter: false },
    {
      path: '/search.json?q=gold+price+OR+gold+market&sort=new&limit=8',
      requireGoldFilter: true
    }
  ];

  const seen = new Set();
  const articles = [];

  for (const feed of feeds) {
    try {
      const redditUrl = `https://www.reddit.com${feed.path}`;
      let data;

      if (isDev) {
        const res = await axios.get(`/api/reddit${feed.path}`, {
          timeout: 12000,
          headers: { 'User-Agent': 'GoldTraderPro/1.0 (gold market news)' }
        });
        data = res.data;
      } else {
        const res = await fetchProxied(redditUrl);
        data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      }

      for (const article of parseRedditResponse(data, feed.requireGoldFilter)) {
        if (seen.has(article.id)) continue;
        seen.add(article.id);
        articles.push(article);
      }
    } catch {
      /* try next feed */
    }
  }

  return articles.length ? articles.slice(0, 15) : null;
}

/** Fetches latest live gold / gold-related market news */
export async function fetchGoldNews() {
  const errors = [];

  try {
    const reddit = await fetchFromRedditGold();
    if (reddit?.length) return { articles: reddit, source: 'reddit' };
  } catch {
    errors.push('reddit');
  }

  try {
    const gnews = await fetchFromGNews();
    if (gnews?.length) return { articles: gnews, source: 'gnews' };
  } catch {
    errors.push('gnews');
  }

  try {
    const kitco = await fetchFromKitcoRss();
    if (kitco?.length) return { articles: kitco, source: 'kitco' };
  } catch {
    errors.push('kitco');
  }

  console.warn('Gold news fetch failed:', errors.join(', '));

  throw new Error(
    import.meta.env.VITE_GNEWS_API_KEY
      ? 'Could not load gold news right now. Check your connection and try again.'
      : 'Could not load gold news. Check your internet connection, or add VITE_GNEWS_API_KEY in .env (free at gnews.io) for more sources.'
  );
}
