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
    const limit = searchParams.get('limit') || undefined;

    const result = await sql`SELECT * FROM notes WHERE user_id = ${user.uid} ORDER BY updated_at DESC`;
    let notes = result.rows as any[];
    if (limit) notes = notes.slice(0, parseInt(limit, 10));
    if (translationId) notes = notes.filter(r => r.translation_id === translationId);
    if (book) notes = notes.filter(r => r.book === book);
    if (chapter) notes = notes.filter(r => r.chapter === parseInt(chapter, 10));
    return NextResponse.json({ notes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Notes GET error:', message);
    return NextResponse.json({ notes: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { action } = body;

    if (action === 'add') {
      const { note } = body;
      const now = new Date().toISOString();
      const result = await sql`
        INSERT INTO notes (user_id, translation_id, book, chapter, verse, text, created_at, updated_at)
        VALUES (${user.uid}, ${note.translationId}, ${note.book}, ${note.chapter}, ${note.verse}, ${note.text}, ${now}, ${now})
        RETURNING id
      `;
      return NextResponse.json({ id: result.rows[0].id });
    }

    if (action === 'update') {
      const { noteId, text } = body;
      const now = new Date().toISOString();
      await sql`
        UPDATE notes SET text = ${text}, updated_at = ${now}
        WHERE id = ${noteId} AND user_id = ${user.uid}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { noteId } = body;
      await sql`DELETE FROM notes WHERE id = ${noteId} AND user_id = ${user.uid}`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Notes POST error:', message);
    return NextResponse.json({ error: 'Notes request failed', details: message }, { status: 500 });
  }
}
