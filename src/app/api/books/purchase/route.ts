import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const body = await request.json();
    const { bookId, paymentMethod } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    const numericBookId = Number(bookId);
    if (!numericBookId || isNaN(numericBookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const bookResult = await sql`SELECT id, title, price, status FROM books WHERE id = ${numericBookId}`;
    if (bookResult.rows.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const book = bookResult.rows[0];
    if (book.status !== 'active') {
      return NextResponse.json({ error: 'Book is not available' }, { status: 403 });
    }

    const price = parseFloat(book.price as string) || 0;

    // Check if already purchased
    const existing = await sql`
      SELECT id FROM purchases
      WHERE user_id = ${decodedToken.uid} AND book_id = ${numericBookId} AND status = 'completed'
    `;
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: true, alreadyPurchased: true, message: 'You already own this book' });
    }

    // For free books, complete purchase immediately
    // For paid books, process payment (simulated for now - integrate Stripe/Paystack when ready)
    const transactionId = price === 0
      ? `free_${Date.now()}`
      : `pay_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const result = await sql`
      INSERT INTO purchases (book_id, user_id, user_email, price_paid, status, payment_method, transaction_id)
      VALUES (${numericBookId}, ${decodedToken.uid}, ${decodedToken.email || null}, ${price}, 'completed', ${paymentMethod || (price === 0 ? 'free' : 'card')}, ${transactionId})
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      purchaseId: String(result.rows[0].id),
      pricePaid: price,
      transactionId,
      message: price === 0 ? 'Book added to your library for free' : 'Payment successful',
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (bookId) {
      const result = await sql`
        SELECT id, status FROM purchases
        WHERE user_id = ${decodedToken.uid} AND book_id = ${Number(bookId)} AND status = 'completed'
      `;
      return NextResponse.json({ purchased: result.rows.length > 0 });
    }

    const result = await sql`
      SELECT p.book_id, p.price_paid, p.purchased_at, b.title, b.author
      FROM purchases p
      JOIN books b ON p.book_id = b.id
      WHERE p.user_id = ${decodedToken.uid} AND p.status = 'completed'
      ORDER BY p.purchased_at DESC
    `;

    return NextResponse.json({
      purchases: result.rows.map((row) => ({
        bookId: String(row.book_id),
        title: row.title,
        author: row.author,
        pricePaid: parseFloat(row.price_paid as string) || 0,
        purchasedAt: row.purchased_at,
      })),
    });
  } catch (error) {
    console.error('Purchase lookup error:', error);
    return NextResponse.json({ error: 'Failed to look up purchases' }, { status: 500 });
  }
}
