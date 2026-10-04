import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const { searchParams } = new URL(request.url);
    const translationId = searchParams.get('translationId');
    const book = searchParams.get('book');

    if (translationId && book) {
      const result = await sql`
        SELECT * FROM reading_progress
        WHERE user_id = ${user.uid} AND translation_id = ${translationId} AND book = ${book}
        LIMIT 1
      `;
      return NextResponse.json({ progress: result.rows[0] || null });
    }

    const result = await sql`
      SELECT * FROM reading_progress WHERE user_id = ${user.uid} ORDER BY last_read_at DESC
    `;
    return NextResponse.json({ progress: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Reading progress GET error:', message);
    return NextResponse.json({ progress: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { progress } = body;

    if (!progress) {
      return NextResponse.json({ error: 'Missing progress' }, { status: 400 });
    }

    await sql`
      INSERT INTO reading_progress (user_id, translation_id, book, chapter, verse, last_read_at)
      VALUES (${user.uid}, ${progress.translationId}, ${progress.book}, ${progress.chapter}, ${progress.verse || 1}, NOW())
      ON CONFLICT (user_id, translation_id, book) DO UPDATE SET
        chapter = EXCLUDED.chapter,
        verse = EXCLUDED.verse,
        last_read_at = EXCLUDED.last_read_at
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Reading progress POST error:', message);
    return NextResponse.json({ error: 'Reading progress save failed', details: message }, { status: 500 });
  }
}
