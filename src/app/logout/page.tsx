import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export default async function LogoutPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
  if (token) {
    const supabase = createServiceClient();
    await supabase.from('sessions').delete().eq('session_token', token);
  }

  cookieStore.set('kingdom_session', '', {
    expires: new Date(0),
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });

  redirect('/login');
}
