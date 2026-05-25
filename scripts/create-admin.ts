// One-time admin user creation script.
// Usage: ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="your-secure-password" npx ts-node scripts/create-admin.ts
//
// Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL env vars.

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

async function main() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD!, 12);
  const referralCode = 'ADMIN' + crypto.randomBytes(2).toString('hex').toUpperCase();
  const plisioUid = 'user_admin_' + crypto.randomBytes(4).toString('hex');

  const { error } = await supabase.from('users').insert({
    username: 'admin',
    email: ADMIN_EMAIL,
    password_hash: passwordHash,
    role: 'admin',
    referral_code: referralCode,
    plisio_uid: plisioUid,
    status: 'active',
  });

  if (error) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }

  console.log('Admin user created successfully.');
  console.log('Email:', ADMIN_EMAIL);
  console.log('Referral code:', referralCode);
}

main();
