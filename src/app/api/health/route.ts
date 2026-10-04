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
      status: 'healthy',
      message: 'RPV Bible AI Assistant is running (Vercel Next.js)',
      embeddings_loaded: true,
      conversation_ready: true,
      backend_type: 'vercel-nextjs',
      ml_available: false,
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    return NextResponse.json({
      status: 'initializing',
      message: 'RPV Bible AI Assistant is starting up',
      embeddings_loaded: false,
      conversation_ready: false,
      backend_type: 'vercel-nextjs',
      ml_available: false,
      timestamp: new Date().toISOString()
    });
  }
}
