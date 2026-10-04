import type { NextApiRequest, NextApiResponse } from 'next';

// Lazy load the search engine to avoid initialization timeout
let searchEnginePromise: Promise<any> | null = null;

async function getSearchEngine() {
  if (!searchEnginePromise) {
    searchEnginePromise = import('@/lib/enhanced-search')
      .then(({ EnhancedBibleSearch }) => new EnhancedBibleSearch())
      .catch((error) => {
        searchEnginePromise = null;
        throw error;
      });
  }
  return searchEnginePromise;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    const query = req.query.q as string;
    const limit = parseInt((req.query.limit as string) || '10');
    const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;

    if (!query || query.trim().length < 2) {
      res.status(400).json({
        error: 'Query must be at least 2 characters long'
      });
      return;
    }

    const engine = await getSearchEngine();
    const results = engine.search(query.trim(), Math.min(limit, 50));
    const suggestions = engine.getSuggestions(query.trim());
    const processingTime = Date.now() - startTime;

    const response = {
      query: query.trim(),
      results,
      total_results: results.length,
      processing_time_ms: processingTime,
      session_id: sessionId,
      backend_type: 'vercel-nextjs',
      suggestions: suggestions.length > 0 ? suggestions.slice(0, 3) : undefined,
      note: results.length > 0 ? undefined : 'No verses found for this query. Try different keywords or check suggestions.'
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'An error occurred while searching. Please try again.'
    });
  }
}
