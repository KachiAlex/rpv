import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { sessionId, feedback } = body;

    if (!sessionId || !feedback || !['helpful', 'not_helpful', 'partially_helpful'].includes(feedback)) {
      return NextResponse.json({ error: 'Missing sessionId or feedback' }, { status: 400 });
    }

    await sql`
      UPDATE bible_search_conversations
      SET feedback = ${feedback}
      WHERE session_id = ${sessionId} AND user_id = ${user.uid}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Feedback error:', message);
    return NextResponse.json({ error: 'Feedback failed', details: message }, { status: 500 });
  }
}
