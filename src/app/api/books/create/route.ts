import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserByEmail, getUserRole, verifyBearerToken } from '@/lib/server-auth';
import { parseAllowedEmails } from '@/lib/book-access';

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const role = await getUserRole(decodedToken.uid);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, author, description, accessLevel, allowedUserEmails, cloudinaryPublicId, cloudinaryUrl, pageCount, price } = body;

    if (!title || !cloudinaryPublicId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emails = parseAllowedEmails(allowedUserEmails || null);
    const allowedUserIds = await Promise.all(
      emails.map(async (email) => {
        try {
          const userRecord = await getUserByEmail(email);
          return userRecord?.uid ?? null;
        } catch {
          return null;
        }
      })
    );

    const result = await sql`
      INSERT INTO books (
        title, author, description, cloudinary_public_id, cloudinary_url,
        page_count, price, uploaded_by, uploaded_by_email, access_level,
        allowed_user_emails, allowed_user_ids, status
      ) VALUES (
        ${title}, ${author || ''}, ${description || ''}, ${cloudinaryPublicId}, ${cloudinaryUrl || ''},
        ${pageCount || 0}, ${price || 0}, ${decodedToken.uid}, ${decodedToken.email || null},
        ${accessLevel === 'restricted' ? 'restricted' : 'public'},
        ${emails as unknown as string}, ${allowedUserIds.filter(Boolean) as unknown as string}, 'active'
      ) RETURNING id
    `;

    const bookId = String(result.rows[0].id);
    return NextResponse.json({ success: true, bookId });
  } catch (error) {
    console.error('Book create error:', error);
    return NextResponse.json({ error: 'Failed to create book record' }, { status: 500 });
  }
}
