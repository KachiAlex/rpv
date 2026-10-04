import { NextRequest, NextResponse } from 'next/server';
import { R2Repository } from '@/lib/repositories/r2-repository';
import { LocalTranslationRepository } from '@/lib/repositories/local-translation-repository';
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

// GET /api/r2/translations/[id]/books/[bookName] — get book content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; bookName: string } }
) {
  try {
    const { id, bookName } = params;

    if (!R2Repository.isConfigured()) {
      const localRepo = new LocalTranslationRepository();
      const book = await localRepo.getBookContent(id, decodeURIComponent(bookName));
      return NextResponse.json({ book });
    }

    const repo = new R2Repository();
    const book = await repo.getBookContent(id, decodeURIComponent(bookName));
    if (!book) {
      return NextResponse.json({ book: null });
    }
    return NextResponse.json({ book });
  } catch (error) {
    console.error('[R2 API] Error getting book:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get book' },
      { status: 500 }
    );
  }
}

// DELETE /api/r2/translations/[id]/books/[bookName] — delete a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; bookName: string } }
) {
  try {
    if (!R2Repository.isConfigured()) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
    }
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const { id, bookName } = params;
    const repo = new R2Repository();
    await repo.deleteBook(id, decodeURIComponent(bookName));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[R2 API] Error deleting book:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete book' },
      { status: 500 }
    );
  }
}
