import { createServiceClient } from '@/lib/supabase/service';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const VALID_PLATFORMS = ['facebook', 'whatsapp', 'instagram', 'twitter', 'x'];

export default async function TestimonyPage({ params, searchParams }: Props) {
  const supabase = createServiceClient();

  const { data: testimony } = await supabase
    .from('testimonies')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!testimony) {
    notFound();
  }

  // Track click if coming from a social platform
  const refPlatform =
    typeof searchParams?.ref === 'string'
      ? searchParams.ref.trim().toLowerCase()
      : null;

  if (refPlatform && VALID_PLATFORMS.includes(refPlatform)) {
    // Upsert: find existing share or create a new one
    const { data: existingShare } = await supabase
      .from('social_shares')
      .select('id, click_count')
      .eq('user_id', testimony.user_id)
      .eq('testimony_id', testimony.id)
      .eq('platform', refPlatform)
      .limit(1);

    if (existingShare && existingShare.length > 0) {
      await supabase
        .from('social_shares')
        .update({ click_count: (existingShare[0].click_count || 0) + 1 })
        .eq('id', existingShare[0].id);
    } else {
      await supabase
        .from('social_shares')
        .insert({
          user_id: testimony.user_id,
          testimony_id: testimony.id,
          platform: refPlatform,
          click_count: 1,
        });
    }

    const { signShareToken } = await import('@/lib/share-token');
    const shareToken = signShareToken(testimony.user_id, testimony.id, refPlatform);
    redirect(`/waitlist/${testimony.referral_code}?share_token=${shareToken}&platform=${refPlatform}&testimony_id=${testimony.id}`);
  }

  const amountDisplay = Number(testimony.amount).toFixed(2);
  const referralUrl = `/waitlist/${testimony.referral_code}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-kt-bg via-kt-surface to-kt-bg flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center space-y-6">
        <div className="text-5xl mb-4">🙏</div>
        <h1 className="text-3xl font-bold text-kt-text-primary">
          {testimony.initials} withdrew{' '}
          <span className="text-emerald-400">${amountDisplay}</span>
        </h1>
        <p className="text-slate-300 text-lg">
          from KingdomTrade - a faith-driven investment platform for pastors and
          congregations.
        </p>
        <Link
          href={referralUrl}
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-kt-text-primary font-semibold py-3 px-8 rounded-xl transition-colors text-lg"
        >
          Join KingdomTrade Now
        </Link>
        <p className="text-slate-500 text-sm pt-4">
          Real withdrawals. Real community. Built on faith.
        </p>
      </div>
    </main>
  );
}
