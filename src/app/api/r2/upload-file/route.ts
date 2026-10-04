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

// POST /api/r2/upload-file — upload a raw file to R2
export async function POST(request: NextRequest) {
  try {
    if (!R2Repository.isConfigured()) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
    }
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const translationId = formData.get('translationId') as string;

    if (!file || !translationId) {
      return NextResponse.json({ error: 'Missing file or translationId' }, { status: 400 });
    }

    const repo = new R2Repository();
    const key = await repo.uploadFile(translationId, file);
    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error('[R2 API] Error uploading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}
