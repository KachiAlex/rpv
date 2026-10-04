import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken, getUserRole } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.POSTGRES_URL) {
      console.error('POSTGRES_URL environment variable is missing');
      return NextResponse.json({ error: 'Database connection not configured (POSTGRES_URL missing)' }, { status: 500 });
    }

    const decodedToken = await verifyBearerToken(request);
    const role = await getUserRole(decodedToken.uid);

    // Admins see all books; regular users see only public + their restricted books
    let result;
    if (role === 'admin') {
      result = await sql`SELECT * FROM books WHERE status = 'active' ORDER BY uploaded_at DESC`;
    } else {
      result = await sql`
        SELECT * FROM books
        WHERE status = 'active'
          AND (
            access_level = 'public'
            OR ${decodedToken.uid} = ANY(allowed_user_ids)
            OR ${decodedToken.email ?? ''} = ANY(allowed_user_emails)
          )
        ORDER BY uploaded_at DESC
      `;
    }

    const books = result.rows.map((row) => ({
      id: String(row.id),
      title: row.title as string,
      author: row.author as string | undefined,
      description: row.description as string | undefined,
      cloudinaryPublicId: row.cloudinary_public_id as string,
      cloudinaryUrl: row.cloudinary_url as string,
      pageCount: (row.page_count as number) || 0,
      price: parseFloat(row.price as string) || 0,
      accessLevel: row.access_level as 'public' | 'restricted',
      allowedUserIds: (row.allowed_user_ids as string[]) || [],
      allowedUserEmails: (row.allowed_user_emails as string[]) || [],
      uploadedAt: row.uploaded_at as string,
      uploadedBy: row.uploaded_by as string,
      status: row.status as string,
    }));

    return NextResponse.json({ books });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Books list error:', message, error);
    return NextResponse.json({ error: 'Failed to load books', details: message }, { status: 500 });
  }
}
