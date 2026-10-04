import { NextRequest, NextResponse } from 'next/server';
import { getUserRole, verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// POST /api/books/upload-signature — no longer needed for R2 (server-side upload)
// Kept for backward compatibility; returns a simple acknowledgment
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const role = await getUserRole(decodedToken.uid);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'R2 upload is handled server-side via /api/books/upload',
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    return NextResponse.json({ error: 'Failed to verify admin access' }, { status: 500 });
  }
}
