import type { NextApiRequest, NextApiResponse } from 'next';

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
  try {
    const query = req.query.q as string || '';
    const engine = await getSearchEngine();
    const suggestions = engine.getSuggestions(query);

    res.status(200).json({
      query,
      suggestions,
      popular_searches: [
        'How to find peace in difficult times',
        'What does the Bible say about love',
        'Overcoming fear and anxiety',
        'Finding strength in weakness',
        "God's forgiveness and mercy",
        'Hope in times of trouble'
      ]
    });
  } catch (error) {
    res.status(200).json({
      query: req.query.q as string || '',
      suggestions: [],
      popular_searches: [
        'How to find peace in difficult times',
        'What does the Bible say about love',
        'Overcoming fear and anxiety'
      ]
    });
  }
}
