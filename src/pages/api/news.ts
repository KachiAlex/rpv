import type { NextApiRequest, NextApiResponse } from 'next';

class BibleNewsService {
  public defaultQuery = 'Bible news Christian updates';

  async fetchNews({ query, limit = 5, sources }: { query?: string; limit?: number; sources?: string } = {}) {
    // Mock news data - in production, this would fetch from actual news APIs
    const articles = [
      {
        title: 'New Biblical Archaeology Discovery',
        description: 'Archaeologists uncover ancient artifacts in Jerusalem',
        source: 'Bible Archaeology Review',
        publishedAt: new Date().toISOString(),
        url: '#'
      },
      {
        title: 'Global Bible Translation Progress',
        description: 'New translations completed for remote communities',
        source: 'Wycliffe Bible Translators',
        publishedAt: new Date().toISOString(),
        url: '#'
      }
    ];

    return articles.slice(0, limit);
  }
}

let cachedNewsService: BibleNewsService | null = null;

function getNewsService() {
  if (!cachedNewsService) {
    cachedNewsService = new BibleNewsService();
  }
  return cachedNewsService;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = req.query.q as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? Math.max(1, Math.min(20, Number(limitParam))) : 5;
    const sources = req.query.sources as string | undefined;

    const newsService = getNewsService();
    const articles = await newsService.fetchNews({ query: q, limit, sources });

    res.status(200).json({
      query: q ?? newsService.defaultQuery,
      total_results: articles.length,
      articles
    });
  } catch (error) {
    console.error('News fetch failed', error);
    res.status(502).json({
      error: 'Unable to load Bible news at the moment. Please try again soon.'
    });
  }
}
