import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { verifyBearerToken, getUserRole } from '@/lib/server-auth';
import { canReadBook } from '@/lib/book-access';
import { sql } from '@/lib/db';
import { getR2Client, getR2BucketName } from '@/lib/r2-client';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decodedToken = await verifyBearerToken(request);
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
      cloudinaryUrl: row.cloudinary_url as string,
      accessLevel: row.access_level as 'public' | 'restricted',
      allowedUserIds: (row.allowed_user_ids as string[]) || [],
      allowedUserEmails: (row.allowed_user_emails as string[]) || [],
      status: row.status as string,
    };

    if (book.status !== 'active') {
      return NextResponse.json({ error: 'Book not available' }, { status: 403 });
    }

    const role = await getUserRole(decodedToken.uid);
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

    const r2Key = row.cloudinary_public_id as string;
    const r2Client = getR2Client();
    const bucketName = getR2BucketName();
    const r2Response = await r2Client.send(new GetObjectCommand({ Bucket: bucketName, Key: r2Key }));
    if (!r2Response.Body) {
      return NextResponse.json({ error: 'Failed to fetch book from R2' }, { status: 502 });
    }

    const headers = new Headers();
    headers.set('Content-Type', r2Response.ContentType || 'application/octet-stream');
    headers.set('Content-Disposition', 'inline');
    if (r2Response.ContentLength) {
      headers.set('Content-Length', String(r2Response.ContentLength));
    }

    const body = r2Response.Body as ReadableStream;
    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    console.error('Stream error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to stream book', details: message }, { status: 500 });
  }
}
