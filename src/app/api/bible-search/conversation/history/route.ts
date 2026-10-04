import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ history: [] }, { status: 400 });
    }

    const result = await sql`
      SELECT history FROM bible_search_conversations
      WHERE session_id = ${sessionId} AND user_id = ${user.uid}
      LIMIT 1
    `;

    const history = result.rows[0]?.history as { role: string; content: string }[] | undefined;
    return NextResponse.json({ history: history || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Conversation history error:', message);
    return NextResponse.json({ history: [], error: message }, { status: 500 });
  }
}
