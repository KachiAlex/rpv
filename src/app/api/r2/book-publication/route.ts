import { NextRequest, NextResponse } from 'next/server';
import { R2Repository } from '@/lib/repositories/r2-repository';
import { verifyBearerToken } from '@/lib/server-auth';

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

// POST /api/r2/book-publication — toggle or update book publication status / introduction
export async function POST(request: NextRequest) {
  try {
    if (!R2Repository.isConfigured()) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
    }
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { translationId, bookName, published, introduction } = body as {
      translationId: string;
      bookName: string;
      published?: boolean;
      introduction?: string;
    };

    if (!translationId || !bookName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const repo = new R2Repository();
    if (typeof published === 'boolean') {
      await repo.updateBookPublicationStatus(translationId, bookName, published);
    }
    if (introduction !== undefined) {
      await repo.updateBookIntroduction(translationId, bookName, introduction);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[R2 API] Error updating book publication:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update publication status' },
      { status: 500 }
    );
  }
}
