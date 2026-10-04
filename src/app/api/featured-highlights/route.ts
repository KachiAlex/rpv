import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await sql`
      SELECT * FROM featured_highlights ORDER BY "order" ASC, created_at DESC LIMIT ${limit}
    `;

    const rows = result.rows.map(r => ({
      ...r,
      order: r.order,
    }));

    return NextResponse.json({ highlights: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Featured highlights GET error:', message);
    return NextResponse.json({ highlights: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const role = await getUserRole(user.uid);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'add') {
      const { highlight } = body;
      const now = new Date().toISOString();
      const result = await sql`
        INSERT INTO featured_highlights (translation_id, book, chapter, verse, text, title, description, "order", created_at, updated_at)
        VALUES (${highlight.translationId}, ${highlight.book}, ${highlight.chapter}, ${highlight.verse}, ${highlight.text}, ${highlight.title || null}, ${highlight.description || null}, ${highlight.order || 0}, ${now}, ${now})
        RETURNING id
      `;
      return NextResponse.json({ id: result.rows[0].id });
    }

    if (action === 'update') {
      const { id, updates } = body;
      const now = new Date().toISOString();
      await sql`
        UPDATE featured_highlights
        SET
          title = COALESCE(${updates.title || null}, title),
          description = COALESCE(${updates.description || null}, description),
          "order" = COALESCE(${updates.order ?? null}, "order"),
          updated_at = ${now}
        WHERE id = ${id}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body;
      await sql`DELETE FROM featured_highlights WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'reorder') {
      const { ids } = body;
      for (let i = 0; i < ids.length; i++) {
        await sql`UPDATE featured_highlights SET "order" = ${i}, updated_at = NOW() WHERE id = ${ids[i]}`;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Featured highlights POST error:', message);
    return NextResponse.json({ error: 'Featured highlights request failed', details: message }, { status: 500 });
  }
}

async function getUserRole(userId: string): Promise<'user' | 'admin'> {
  const { userRepository } = await import('@/lib/repositories/user-repository');
  const user = await userRepository.getUserByUid(userId);
  return user?.role || 'user';
}
