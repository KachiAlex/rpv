import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sql } from '@/lib/db';
import { getUserRole, verifyBearerToken } from '@/lib/server-auth';
import { canReadBook } from '@/lib/book-access';
import { getR2Client, getR2BucketName, isR2Configured } from '@/lib/r2-client';

export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
    }

    const decodedToken = await verifyBearerToken(request);
    const body = await request.json();
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing required parameter: bookId' },
        { status: 400 }
      );
    }

    const numericBookId = Number(bookId);
    if (!numericBookId || isNaN(numericBookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const result = await sql`SELECT * FROM books WHERE id = ${numericBookId}`;
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
      accessLevel: row.access_level as 'public' | 'restricted',
      allowedUserIds: (row.allowed_user_ids as string[]) || [],
      allowedUserEmails: (row.allowed_user_emails as string[]) || [],
      uploadedAt: row.uploaded_at as string,
      uploadedBy: row.uploaded_by as string,
      status: row.status as string,
    };

    if (book.status !== 'active') {
      return NextResponse.json({ error: 'Book is not available' }, { status: 403 });
    }

    const role = await getUserRole(decodedToken.uid);
    const hasBookAccess = canReadBook(book, {
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
      role,
    });

    if (!hasBookAccess) {
      return NextResponse.json({ error: 'You do not have access to this book' }, { status: 403 });
    }

    if (!book.cloudinaryPublicId) {
      return NextResponse.json({ error: 'Book asset is missing' }, { status: 500 });
    }

    const r2Key = book.cloudinaryPublicId;
    const command = new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: r2Key,
    });
    const signedUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: 3600,
    });

    await sql`
      INSERT INTO access_logs (book_id, user_id, user_email, access_type, page_number)
      VALUES (${numericBookId}, ${decodedToken.uid}, ${decodedToken.email || null}, 'view', null)
    `;

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
