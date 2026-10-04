import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyBearerToken, getUserRole } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const role = await getUserRole(user.uid);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const db = getDb();
    await db.query(schema);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('DB init error:', message);
    return NextResponse.json({ error: 'DB init failed', details: message }, { status: 500 });
  }
}
