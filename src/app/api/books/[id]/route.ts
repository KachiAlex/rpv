import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken, getUserRole } from '@/lib/server-auth';
import { canReadBook } from '@/lib/book-access';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const role = await getUserRole(decodedToken.uid);
    const bookId = Number(params.id);

    if (!bookId || isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const result = await sql`SELECT * FROM books WHERE id = ${bookId}`;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const book = {
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
    };

    const hasAccess =
      role === 'admin' ||
      canReadBook(book, {
        userId: decodedToken.uid,
        userEmail: decodedToken.email || null,
        role,
      });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Book get error:', error);
    return NextResponse.json({ error: 'Failed to load book' }, { status: 500 });
  }
}
