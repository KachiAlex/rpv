import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const user = await verifyBearerToken(request).catch(() => null);

    if (planId) {
      const planResult = await sql`SELECT * FROM reading_plans WHERE id = ${planId} LIMIT 1`;
      const plan = planResult.rows[0] || null;
      let progress = null;
      if (user) {
        const progressResult = await sql`SELECT * FROM reading_plan_progress WHERE plan_id = ${planId} AND user_id = ${user.uid} LIMIT 1`;
        progress = progressResult.rows[0] || null;
      }
      return NextResponse.json({ plan, progress });
    }

    const publicPlans = await sql`
      SELECT * FROM reading_plans WHERE is_public = TRUE ORDER BY created_at DESC LIMIT 20
    `;

    let myProgress: any[] = [];
    if (user) {
      const progressResult = await sql`
        SELECT p.*, pl.name as plan_name
        FROM reading_plan_progress p
        JOIN reading_plans pl ON p.plan_id = pl.id
        WHERE p.user_id = ${user.uid}
      `;
      myProgress = progressResult.rows;
    }

    return NextResponse.json({ plans: publicPlans.rows, myProgress });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Reading plans GET error:', message);
    return NextResponse.json({ plans: [], myProgress: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { plan } = body;
      const now = new Date().toISOString();
      const result = await sql`
        INSERT INTO reading_plans (name, description, duration_days, is_public, schedule, created_at, updated_at)
        VALUES (${plan.name}, ${plan.description || null}, ${plan.durationDays}, ${plan.isPublic ?? true}, ${JSON.stringify(plan.schedule || {})}, ${now}, ${now})
        RETURNING id
      `;
      return NextResponse.json({ id: result.rows[0].id });
    }

    if (action === 'start') {
      const { planId, startDate } = body;
      const now = new Date().toISOString();
      const start = startDate || new Date().toISOString().slice(0, 10);
      const result = await sql`
        INSERT INTO reading_plan_progress (user_id, plan_id, start_date, current_day, created_at, updated_at)
        VALUES (${user.uid}, ${planId}, ${start}, 1, ${now}, ${now})
        RETURNING id
      `;
      return NextResponse.json({ id: result.rows[0].id });
    }

    if (action === 'completeDay') {
      const { progressId, day } = body;
      await sql`
        UPDATE reading_plan_progress
        SET completed_days = array_append(completed_days, ${day}),
            current_day = GREATEST(current_day, ${day + 1}),
            updated_at = NOW()
        WHERE id = ${progressId} AND user_id = ${user.uid}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { progressId } = body;
      await sql`DELETE FROM reading_plan_progress WHERE id = ${progressId} AND user_id = ${user.uid}`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Reading plans POST error:', message);
    return NextResponse.json({ error: 'Reading plans request failed', details: message }, { status: 500 });
  }
}
