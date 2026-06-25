import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const MIGRATION_SQL = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name              TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone                  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth          DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country                TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city                   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address                TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url             TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status             TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_type      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_url       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_selfie_url         TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at       TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_at        TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_rejection_reason   TEXT;
`.trim();

export async function POST(req: NextRequest) {
  const token = req.cookies.get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role, expires_at')
    .eq('session_token', token)
    .limit(1);

  const sess = (sessions ?? []) as unknown as { user_id: number; user_role: string; expires_at: string }[];
  if (sess.length === 0 || new Date(sess[0].expires_at) < new Date()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (sess[0].user_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey,
    'Content-Type': 'application/json',
  };

  // Method 1: Try Supabase SQL API (/pg/query)
  try {
    const res = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: MIGRATION_SQL }),
    });
    if (res.ok) {
      return NextResponse.json({ success: true, method: 'pg_query' });
    }
  } catch {
    // /pg/query not available, try next method
  }

  // Method 2: Try exec_sql RPC via PostgREST
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ sql_text: MIGRATION_SQL }),
    });
    if (res.ok) {
      return NextResponse.json({ success: true, method: 'rpc' });
    }
  } catch {
    // RPC not available either
  }

  // Method 3: Try supabase-js .rpc() as last automated attempt
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_text: MIGRATION_SQL });
    if (!error) {
      return NextResponse.json({ success: true, method: 'supabase_js_rpc' });
    }
  } catch {
    // All automated methods failed
  }

  // All methods failed -- return SQL for manual execution
  return NextResponse.json({
    success: false,
    method: 'manual',
    message: 'Automatic migration not available on this Supabase plan. Run the SQL manually.',
    sql: MIGRATION_SQL,
  });
}
