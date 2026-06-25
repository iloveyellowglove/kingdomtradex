import Link from 'next/link';

const LEVELS = [
  { lv: 1, deposit: '3%', profit: '5%' },
  { lv: 2, deposit: '1.5%', profit: '2.5%' },
  { lv: 3, deposit: '0.75%', profit: '1.25%' },
  { lv: 4, deposit: '0.5%', profit: '0.75%' },
  { lv: 5, deposit: '0.25%', profit: '0.5%' },
];

export default function ReferralHighlight() {
  return (
    <section className="py-16 lg:py-20" style={{ background: '#0B0E11' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[22px] sm:text-[28px] font-semibold text-[#EAECEF] mb-2">Earn More by Sharing</h2>
          <p className="text-sm text-[#848E9C] max-w-[500px] mx-auto">Earn commissions from 5 levels of referrals - every time they deposit and earn.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 max-w-[900px] mx-auto items-start">
          {/* LEFT: Rate table */}
          <div className="flex-1 w-full">
            <div className="rounded-xl overflow-hidden" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
              <div className="grid grid-cols-4 gap-2 px-5 py-3 text-xs font-semibold text-[#5E6673] border-b" style={{ borderColor: '#2B3139' }}>
                <span>Level</span><span>Deposit Bonus</span><span>Profit Share</span><span>Type</span>
              </div>
              {LEVELS.map((l, i) => (
                <div key={l.lv} className="grid grid-cols-4 gap-2 px-5 py-3 text-sm border-b last:border-b-0" style={{ borderColor: '#2B3139', background: i === 0 ? 'rgba(240,185,11,0.03)' : 'transparent' }}>
                  <span className="text-[#F0B90B] font-bold">L{l.lv}</span>
                  <span className="text-[#EAECEF] font-medium tabular-nums">{l.deposit}</span>
                  <span className="text-[#0ECB81] font-medium tabular-nums">{l.profit}</span>
                  <span className="text-[#5E6673] text-xs">{l.lv === 1 ? 'Direct' : `Indirect`}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Example */}
          <div className="lg:w-80 flex-shrink-0 w-full">
            <div className="p-6 rounded-xl" style={{ background: '#1E2329', border: '1px solid #F0B90B', borderColor: 'rgba(240,185,11,0.2)' }}>
              <h3 className="font-semibold text-[#EAECEF] mb-3">Example Calculation</h3>
              <p className="text-sm text-[#848E9C] mb-4">If you refer 10 people who each deposit $1,000:</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5E6673]">Instant bonus (L1):</span>
                  <span className="text-[#F0B90B] font-bold tabular-nums">$300</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5E6673]">Monthly passive:</span>
                  <span className="text-[#0ECB81] font-bold tabular-nums">~$225/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5E6673]">Yearly projected:</span>
                  <span className="text-[#EAECEF] font-bold tabular-nums">~$2,700/yr</span>
                </div>
              </div>
              <p className="text-xs text-[#5E6673] mt-4">Your referral link is generated automatically on signup.</p>
              <Link href="/register"
                className="block w-full mt-4 py-3 rounded-lg text-center text-sm font-semibold no-underline"
                style={{ background: '#F0B90B', color: '#0B0E11' }}>
                Start Earning from Referrals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
