import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';
import { sql } from '@/lib/db';
import { getUserByEmail, getUserRole, verifyBearerToken } from '@/lib/server-auth';
import { parseAllowedEmails } from '@/lib/book-access';
import { getR2Client, getR2BucketName } from '@/lib/r2-client';

export async function POST(request: NextRequest) {
  console.log('[upload] Request received, content-length:', request.headers.get('content-length'));
  try {
    const decodedToken = await verifyBearerToken(request);
    const role = await getUserRole(decodedToken.uid);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[upload] Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const description = formData.get('description') as string;
    const accessLevel = formData.get('accessLevel') === 'restricted' ? 'restricted' : 'public';
    const allowedUserEmails = parseAllowedEmails(formData.get('allowedUserEmails') as string | null);
    const rawPageCount = formData.get('pageCount');
    const pageCount = rawPageCount ? Math.max(0, parseInt(rawPageCount as string, 10) || 0) : 0;
    const rawPrice = formData.get('price');
    const price = rawPrice ? Math.max(0, parseFloat(rawPrice as string) || 0) : 0;

    console.log('[upload] File:', file?.name, 'size:', file?.size, 'title:', title);

    if (!file || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vercel Hobby plan has ~4.5MB body limit
    const MAX_SIZE_MB = 4;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Maximum is ${MAX_SIZE_MB}MB on this plan.` },
        { status: 413 }
      );
    }

    const allowedUserIds = await Promise.all(
      allowedUserEmails.map(async (email) => {
        try {
          const userRecord = await getUserByEmail(email);
          return userRecord?.uid ?? null;
        } catch (error) {
          console.warn(`Could not resolve allowed email ${email}:`, error);
          return null;
        }
      })
    );

    console.log('[upload] Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('[upload] Buffer ready, size:', buffer.length);

    console.log('[upload] Uploading to R2...');
    const r2Key = `books/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const r2Client = getR2Client();
    const bucketName = getR2BucketName();
    await r2Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    }));
    const r2Url = `/api/r2/raw/${encodeURIComponent(r2Key)}`;
    console.log('[upload] R2 done:', r2Key);

    const filteredIds = allowedUserIds.filter((userId: string | null): userId is string => Boolean(userId));

    console.log('[upload] Inserting into Postgres...');
    const result = await sql`
      INSERT INTO books (
        title, author, description, cloudinary_public_id, cloudinary_url,
        page_count, price, uploaded_by, uploaded_by_email, access_level,
        allowed_user_emails, allowed_user_ids, status
      ) VALUES (
        ${title}, ${author || ''}, ${description || ''}, ${r2Key}, ${r2Url},
        ${pageCount}, ${price}, ${decodedToken.uid}, ${decodedToken.email || null}, ${accessLevel},
        ${allowedUserEmails as unknown as string}, ${filteredIds as unknown as string}, 'active'
      ) RETURNING id
    `;

    const bookId = String(result.rows[0].id);
    console.log('[upload] Success, bookId:', bookId);

    return NextResponse.json({ success: true, bookId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[upload] Error:', message, error);
    return NextResponse.json(
      { error: 'Failed to upload book', details: message },
      { status: 500 }
    );
  }
}
