import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const body = await request.json();
    const { bookId, accessType, pageNumber } = body;

    if (!bookId || !accessType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const numericBookId = Number(bookId);
    if (!numericBookId || isNaN(numericBookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    await sql`
      INSERT INTO access_logs (book_id, user_id, user_email, access_type, page_number)
      VALUES (${numericBookId}, ${decodedToken.uid}, ${decodedToken.email || null}, ${accessType}, ${pageNumber || null})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log access error:', error);
    return NextResponse.json({ error: 'Failed to log access' }, { status: 500 });
  }
}
