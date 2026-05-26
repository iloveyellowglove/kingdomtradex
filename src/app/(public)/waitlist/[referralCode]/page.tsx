import { redirect } from 'next/navigation';

export default function WaitlistReferralPage({
  params,
}: {
  params: { referralCode: string };
}) {
  redirect(`/?ref=${params.referralCode}#signup`);
}
