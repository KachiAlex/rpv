import { NextRequest, NextResponse } from 'next/server';
import { R2Repository } from '@/lib/repositories/r2-repository';
import { LocalTranslationRepository } from '@/lib/repositories/local-translation-repository';
import { verifyBearerToken } from '@/lib/server-auth';
import type { Translation } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    const user = await verifyBearerToken(request);
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

// GET /api/r2/translations — list all translations
export async function GET() {
  try {
    if (!R2Repository.isConfigured()) {
      const localRepo = new LocalTranslationRepository();
      const translations = await localRepo.getAllTranslations();
      return NextResponse.json({ translations });
    }
    const repo = new R2Repository();
    const translations = await repo.getAllTranslations();
    return NextResponse.json({ translations });
  } catch (error) {
    console.error('[R2 API] Error listing translations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list translations' },
      { status: 500 }
    );
  }
}

// POST /api/r2/translations — save or merge a translation
export async function POST(request: NextRequest) {
  try {
    if (!R2Repository.isConfigured()) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
    }
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { replace, ...translation } = body ?? {};
    if (!translation?.id || !Array.isArray(translation.books)) {
      return NextResponse.json({ error: 'Invalid translation payload' }, { status: 400 });
    }
    const repo = new R2Repository();
    // Merge into the existing translation by default. A bare saveTranslation()
    // would replace the manifest, dropping every book not present in the
    // request body. Pass { replace: true } only for an intentional full write.
    const result = replace === true
      ? (await repo.saveTranslation(translation as Translation), translation)
      : await repo.mergeTranslation(translation as Translation);
    return NextResponse.json({ success: true, translation: result });
  } catch (error) {
    console.error('[R2 API] Error saving translation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save translation' },
      { status: 500 }
    );
  }
}
