import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createStubSupabaseClient } from './stub';

export function createServiceClient() {
  // Use stub client when no real Supabase is configured (local dev)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost:54321') {
    console.warn('[supabase] Using stub service client — no real Supabase configured');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createStubSupabaseClient() as any;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
