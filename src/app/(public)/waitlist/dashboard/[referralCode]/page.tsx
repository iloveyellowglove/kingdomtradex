import { getWaitlistDashboard } from '@/lib/db/waitlist';
import { notFound } from 'next/navigation';
import WaitlistDashboardClient from '@/components/waitlist/WaitlistDashboardClient';

export default async function WaitlistDashboardPage({
  params,
}: {
  params: { referralCode: string };
}) {
  const { referralCode } = params;

  let dashboard;
  try {
    dashboard = await getWaitlistDashboard(referralCode);
  } catch {
    return notFound();
  }

  if (!dashboard || !dashboard.entry) {
    return notFound();
  }

  return (
    <WaitlistDashboardClient
      entry={dashboard.entry}
      nextMilestone={dashboard.nextMilestone}
      referrals={dashboard.referrals}
    />
  );
}
