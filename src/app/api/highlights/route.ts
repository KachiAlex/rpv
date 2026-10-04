import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const { searchParams } = new URL(request.url);
    const translationId = searchParams.get('translationId') || undefined;
    const book = searchParams.get('book') || undefined;
    const chapter = searchParams.get('chapter') || undefined;

    const result = await sql`SELECT * FROM highlights WHERE user_id = ${user.uid} ORDER BY created_at DESC`;
    let highlights = result.rows as any[];
    if (translationId) highlights = highlights.filter(r => r.translation_id === translationId);
    if (book) highlights = highlights.filter(r => r.book === book);
    if (chapter) highlights = highlights.filter(r => r.chapter === parseInt(chapter, 10));
    return NextResponse.json({ highlights });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Highlights GET error:', message);
    return NextResponse.json({ highlights: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { action } = body;

    if (action === 'add') {
      const { highlight } = body;
      const now = new Date().toISOString();
      const result = await sql`
        INSERT INTO highlights (user_id, translation_id, book, chapter, verse, color, note, created_at, updated_at)
        VALUES (${user.uid}, ${highlight.translationId}, ${highlight.book}, ${highlight.chapter}, ${highlight.verse}, ${highlight.color || 'yellow'}, ${highlight.note || null}, ${now}, ${now})
        RETURNING id
      `;
      return NextResponse.json({ id: result.rows[0].id });
    }

    if (action === 'remove') {
      const { highlightId } = body;
      await sql`DELETE FROM highlights WHERE id = ${highlightId} AND user_id = ${user.uid}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'removeByVerse') {
      const { translationId, book, chapter, verse } = body;
      await sql`
        DELETE FROM highlights
        WHERE user_id = ${user.uid}
          AND translation_id = ${translationId}
          AND book = ${book}
          AND chapter = ${chapter}
          AND verse = ${verse}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'updateColor') {
      const { highlightId, color } = body;
      const now = new Date().toISOString();
      await sql`
        UPDATE highlights SET color = ${color}, updated_at = ${now}
        WHERE id = ${highlightId} AND user_id = ${user.uid}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'updateNote') {
      const { highlightId, note } = body;
      const now = new Date().toISOString();
      await sql`
        UPDATE highlights SET note = ${note}, updated_at = ${now}
        WHERE id = ${highlightId} AND user_id = ${user.uid}
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Highlights POST error:', message);
    return NextResponse.json({ error: 'Highlights request failed', details: message }, { status: 500 });
  }
}
