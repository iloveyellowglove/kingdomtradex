// One-time migration: initialize dummy_balance for existing users
// Usage: npx ts-node scripts/migrate-dummy-balance.ts

import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase.rpc('update_null_dummy_balances');

  if (error) {
    // Try manual update if RPC doesn't exist yet
    console.log('RPC not found, using manual update...');
    const { data: result, error: updateErr } = await supabase
      .from('users')
      .update({ dummy_balance: 10000, dummy_initialized_at: new Date().toISOString() })
      .is('dummy_initialized_at', null)
      .select('id');

    if (updateErr) {
      console.error('Update failed:', updateErr.message);
      process.exit(1);
    }

    console.log(`Updated ${result?.length ?? 0} users with default dummy balance.`);
  } else {
    console.log('Dummy balances initialized:', data);
  }
}

main();
