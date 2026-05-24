import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const seedToken = request.headers.get('X-Seed-Token');
  if (!seedToken || seedToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sqlPath = path.join(process.cwd(), 'sql', 'seed_demo_data.sql');
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json({ success: false, error: 'Seed SQL file not found at sql/seed_demo_data.sql' }, { status: 500 });
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Supabase environment variables not configured' }, { status: 500 });
    }

    const response = await fetch(`${supabaseUrl}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `SQL execution failed (${response.status}): ${errorText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Demo data seeded successfully. 200 waitlist, 50 users, 500 profits, 75 deposits, 30 withdrawals, 100 commissions.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
