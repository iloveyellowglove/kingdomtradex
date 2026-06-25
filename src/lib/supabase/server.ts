import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createStubSupabaseClient } from './stub';

export function createClient() {
  // Use stub client when no real Supabase is configured (local dev)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost:54321') {
    console.warn('[supabase] Using stub client — no real Supabase configured');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createStubSupabaseClient() as any;
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Cookie set from server component can fail - ignore
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Cookie remove from server component can fail - ignore
          }
        },
      },
    }
  );
}
