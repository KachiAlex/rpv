import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

import { userRepository } from '@/lib/repositories/user-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    if (action === 'preferences') {
      const result = await sql`SELECT preferences FROM user_profiles WHERE user_id = ${user.uid}`;
      const preferences = result.rows[0]?.preferences || {};
      return NextResponse.json({ preferences });
    }

    if (action === 'bookmarks') {
      const folder = searchParams.get('folder') || undefined;
      const tag = searchParams.get('tag') || undefined;
      const result = await sql`SELECT * FROM bookmarks WHERE user_id = ${user.uid} ORDER BY created_at DESC`;
      let bookmarks = result.rows;
      if (folder) bookmarks = bookmarks.filter((row: any) => row.label === folder);
      if (tag) bookmarks = bookmarks.filter((row: any) => (row.tags || []).includes(tag));
      return NextResponse.json({ bookmarks });
    }

    if (action === 'folders') {
      const result = await sql`SELECT id, name, color, created_at FROM tags WHERE user_id = ${user.uid}`;
      return NextResponse.json({ folders: result.rows });
    }

    if (action === 'tags') {
      const result = await sql`SELECT DISTINCT name FROM tags WHERE user_id = ${user.uid}`;
      return NextResponse.json({ tags: result.rows.map(r => r.name) });
    }

    if (action === 'history') {
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const result = await sql`SELECT * FROM reading_history WHERE user_id = ${user.uid} ORDER BY read_at DESC LIMIT ${limit}`;
      return NextResponse.json({ history: result.rows });
    }

    if (action === 'role') {
      const result = await sql`SELECT role FROM user_profiles WHERE user_id = ${user.uid}`;
      return NextResponse.json({ role: result.rows[0]?.role || 'user' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('User GET error:', message);
    return NextResponse.json({ error: 'User request failed', details: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    if (action === 'savePreferences') {
      const { preferences } = body;
      await sql`
        INSERT INTO user_profiles (user_id, email, display_name, role, preferences, updated_at)
        VALUES (${user.uid}, ${user.email}, ${user.displayName || ''}, ${user.role}, ${JSON.stringify(preferences)}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          preferences = EXCLUDED.preferences,
          updated_at = NOW()
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'addBookmark') {
      const { bookmark } = body;
      const now = new Date().toISOString();
      const result = await sql`
        INSERT INTO bookmarks (user_id, translation_id, book, chapter, verse, label, created_at)
        VALUES (${user.uid}, ${bookmark.translationId}, ${bookmark.book}, ${bookmark.chapter}, ${bookmark.verse}, ${bookmark.label || null}, ${now})
        RETURNING id
      `;
      return NextResponse.json({ id: result.rows[0].id });
    }

    if (action === 'removeBookmark') {
      const { bookmarkId } = body;
      await sql`DELETE FROM bookmarks WHERE id = ${bookmarkId} AND user_id = ${user.uid}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'createFolder') {
      const { name, color } = body;
      const now = new Date().toISOString();
      const result = await sql`
        INSERT INTO tags (user_id, name, color, created_at)
        VALUES (${user.uid}, ${name}, ${color || null}, ${now})
        RETURNING id
      `;
      return NextResponse.json({ id: result.rows[0].id });
    }

    if (action === 'deleteFolder') {
      const { folderId } = body;
      await sql`DELETE FROM tags WHERE id = ${folderId} AND user_id = ${user.uid}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'addHistory') {
      const { history } = body;
      const now = new Date().toISOString();
      await sql`
        INSERT INTO reading_history (user_id, translation_id, book, chapter, verse, read_at)
        VALUES (${user.uid}, ${history.translationId}, ${history.book}, ${history.chapter}, ${history.verse}, ${now})
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'createProfile') {
      const { profile } = body;
      await sql`
        INSERT INTO user_profiles (user_id, email, display_name, role, preferences, updated_at)
        VALUES (${user.uid}, ${profile.email || user.email}, ${profile.displayName || user.displayName || ''}, ${user.role}, ${JSON.stringify({})}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role,
          updated_at = NOW()
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'setAdminRole') {
      const { isAdmin } = body;
      const role = isAdmin ? 'admin' : 'user';
      await sql`
        UPDATE user_profiles SET role = ${role}, updated_at = NOW()
        WHERE user_id = ${user.uid}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'changePassword') {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      // Verify current password
      try {
        await userRepository.verifyUser(user.email, currentPassword);
      } catch {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      await userRepository.updatePassword(user.email, newPassword);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('User POST error:', message);
    return NextResponse.json({ error: 'User request failed', details: message }, { status: 500 });
  }
}
