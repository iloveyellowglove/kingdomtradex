import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { timingSafeEqual } from '@/lib/auth/csrf';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = [
  'daily_profit_percentage',
  'withdrawal_lock_hours',
  'min_deposit_usdt',
  'min_deposit_btc',
  'min_deposit_eth',
  'min_withdrawal_usdt',
  'commission_l1',
  'commission_l2',
  'commission_l3',
  'commission_l4',
  'commission_l5',
];

const PERCENTAGE_KEYS = ['daily_profit_percentage', 'commission_l1', 'commission_l2', 'commission_l3', 'commission_l4', 'commission_l5'];
const HOURS_KEYS = ['withdrawal_lock_hours'];
const MIN_AMOUNT_KEYS = ['min_deposit_usdt', 'min_deposit_btc', 'min_deposit_eth', 'min_withdrawal_usdt'];

async function validateAdmin(req: NextRequest) {
  const token = req.cookies.get('kingdom_session')?.value;
  if (!token || token.length !== 64) return null;

  const supabase = createServiceClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, expires_at, user_role, csrf_token')
    .eq('session_token', token)
    .limit(1);

  const sess = (sessions ?? []) as unknown as { user_id: number; expires_at: string; user_role: string; csrf_token: string }[];
  if (sess.length === 0) return null;
  if (new Date(sess[0].expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('session_token', token);
    return null;
  }
  if (sess[0].user_role !== 'admin') return null;

  return { supabase, adminId: sess[0].user_id, session: sess[0] };
}

function validateValue(key: string, value: unknown): string | null {
  if (value === undefined || value === null) {
    return 'Value is required.';
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return 'Value must be a string or number.';
  }

  const num = Number(value);
  if (isNaN(num)) return 'Value must be a valid number.';

  if (PERCENTAGE_KEYS.includes(key)) {
    if (num < 0 || num > 100) return 'Percentage must be between 0 and 100.';
  }

  if (HOURS_KEYS.includes(key)) {
    if (!Number.isInteger(num) || num <= 0) return 'Lock hours must be a positive integer.';
  }

  if (MIN_AMOUNT_KEYS.includes(key)) {
    if (num <= 0) return 'Amount must be a positive number.';
  }

  return null;
}

export async function GET(req: NextRequest) {
  const admin = await validateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { supabase } = admin;

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .order('id');

  return NextResponse.json({ settings: settings || [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await validateAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { supabase, adminId, session } = admin;

  const csrfHeader = request.headers.get('x-csrf-token');
  if (!csrfHeader || !timingSafeEqual(csrfHeader, session.csrf_token)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const key = typeof body.key === 'string' ? body.key : null;
  const value = body.value;

  if (!key || !ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ success: false, error: 'Invalid or disallowed setting key.' }, { status: 400 });
  }

  const validationError = validateValue(key, value);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const stringValue = String(value);

  const { data: oldSetting } = await supabase
    .from('settings')
    .select('setting_value')
    .eq('setting_key', key)
    .limit(1);

  const oldValue = oldSetting?.[0]?.setting_value ?? null;

  const { error } = await supabase
    .from('settings')
    .update({ setting_value: stringValue })
    .eq('setting_key', key);

  if (error) {
    console.error('[settings] update error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to update setting.' }, { status: 500 });
  }

  try {
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action: 'update_setting',
      target_table: 'settings',
      target_id: null,
      old_value: oldValue,
      new_value: stringValue,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      created_at: new Date().toISOString(),
    });
  } catch (auditErr) {
    console.error('[settings] audit log insert failed:', auditErr);
  }

  return NextResponse.json({ success: true, key, value: stringValue });
}
