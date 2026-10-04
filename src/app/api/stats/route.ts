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
      status: 'ready',
      total_verses: stats.total_verses,
      backend_type: 'vercel-nextjs',
      ml_available: false,
      enhanced_features: true,
      ...stats,
      note: 'Running Vercel Next.js with comprehensive Bible data'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'initializing',
      backend_type: 'vercel-nextjs',
      ml_available: false,
      enhanced_features: true
    });
  }
}
