import { NextRequest, NextResponse } from 'next/server';
import { R2Repository } from '@/lib/repositories/r2-repository';
import { LocalTranslationRepository } from '@/lib/repositories/local-translation-repository';

export const dynamic = 'force-dynamic';

// GET /api/r2/translations/[id] — get a translation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const full = request.nextUrl.searchParams.get('full') === 'true';

    if (!R2Repository.isConfigured()) {
      const localRepo = new LocalTranslationRepository();
      const translation = await localRepo.getTranslation(id, full);
      return NextResponse.json({ translation });
    }

    const repo = new R2Repository();
    const translation = await repo.getTranslation(id, full);
    if (!translation) {
      return NextResponse.json({ translation: null });
    }
    return NextResponse.json({ translation });
  } catch (error) {
    console.error('[R2 API] Error getting translation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get translation' },
      { status: 500 }
    );
  }
}
