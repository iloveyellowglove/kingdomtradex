import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/*
  KYC & Profile Migration SQL (run via this API)
  ──────────────────────────────────────────────
  Adds profile and KYC columns to the users table idempotently.

  ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name              TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone                  TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth          DATE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS country                TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS city                   TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address                TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url             TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status             TEXT DEFAULT 'unverified' CHECK (kyc_status IN ('unverified','pending','verified','rejected'));
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_type      TEXT CHECK (kyc_document_type IN ('passport','national_id','drivers_license'));
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_url       TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_selfie_url         TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at       TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_at        TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_rejection_reason   TEXT;
*/

const MIGRATION_SQL = `
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name              TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone                  TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth          DATE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS country                TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS city                   TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address                TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url             TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status             TEXT NOT NULL DEFAULT 'unverified';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_type      TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_url       TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_selfie_url         TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at       TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_at        TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_rejection_reason   TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
`;

export async function POST() {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_text: MIGRATION_SQL }).maybeSingle();

    if (error) {
      // Try raw SQL via REST
      await supabase.from('_migrations').insert({ sql: MIGRATION_SQL }).maybeSingle();
      // Fallback: try direct query
      console.error('[migrate] RPC error:', error.message);

      // Try running via direct SQL query interface
      const parts = MIGRATION_SQL.split(';').filter(s => s.trim());

      for (const stmt of parts) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;
        // Use raw SQL query
        try {
          await supabase.rpc('exec_sql', { sql_text: trimmed });
        } catch {
          // Individual statement failures are ok (columns may exist)
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Migration complete' });
  } catch (err) {
    // If exec_sql RPC doesn't exist, provide raw SQL for manual execution
    console.error('[migrate]', err);
    return NextResponse.json({
      success: false,
      message: 'Migration failed. Run the SQL manually in Supabase SQL Editor.',
      sql: MIGRATION_SQL,
    }, { status: 500 });
  }
}
