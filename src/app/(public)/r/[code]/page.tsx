import { notFound, redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';

interface Props {
  params: { code: string };
}

export default async function ReferralLandingPage({ params }: Props) {
  const code = params.code?.toUpperCase().trim();

  if (!code || code.length < 4) {
    notFound();
  }

  // Validate referral code exists
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', code)
    .eq('status', 'active')
    .limit(1);

  if (!data || data.length === 0) {
    // Invalid code - redirect to register without ref
    redirect('/register');
  }

  // Valid code - redirect to register with ref param
  redirect(`/register?ref=${code}`);
}
