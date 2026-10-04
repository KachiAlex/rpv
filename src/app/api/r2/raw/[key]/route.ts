import { NextRequest, NextResponse } from 'next/server';
import { R2Repository } from '@/lib/repositories/r2-repository';

export const dynamic = 'force-dynamic';

// GET /api/r2/raw/[key] — serve raw file from R2
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    if (!R2Repository.isConfigured()) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
    }
    const { key } = params;
    const repo = new R2Repository();
    const decodedKey = decodeURIComponent(key);
    const buffer = await repo.getRawFileByKey(decodedKey);
    if (!buffer) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(buffer));
  } catch (error) {
    console.error('[R2 API] Error serving raw file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to serve file' },
      { status: 500 }
    );
  }
}
