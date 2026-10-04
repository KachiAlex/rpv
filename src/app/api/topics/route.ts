import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const engine = await getSearchEngine();
    const stats = engine.getStats();
    
    return NextResponse.json({
      available_topics: stats.most_common_topics,
      topic_categories: {
        'Emotional Support': ['anxiety', 'fear', 'comfort', 'peace', 'hope'],
        'Spiritual Growth': ['faith', 'prayer', 'wisdom', 'love', 'forgiveness'],
        'Life Guidance': ['strength', 'guidance', 'purpose', 'provision', 'protection'],
        'Relationships': ['love', 'forgiveness', 'kindness', 'marriage', 'family']
      },
      total_topics: stats.total_topics
    });
  } catch (error) {
    return NextResponse.json({
      available_topics: [],
      topic_categories: {
        'Emotional Support': ['anxiety', 'fear', 'comfort', 'peace', 'hope'],
        'Spiritual Growth': ['faith', 'prayer', 'wisdom', 'love', 'forgiveness'],
        'Life Guidance': ['strength', 'guidance', 'purpose', 'provision', 'protection'],
        'Relationships': ['love', 'forgiveness', 'kindness', 'marriage', 'family']
      },
      total_topics: 0
    });
  }
}
