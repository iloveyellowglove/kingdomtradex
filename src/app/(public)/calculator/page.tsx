import EarningsCalculator from '@/components/earnings/EarningsCalculator';

export const metadata = {
  title: 'Earnings Calculator - KingdomTradex',
  description: 'Estimate your daily, weekly, and monthly earnings with our interactive crypto investment calculator.',
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen py-8 px-4 bg-kt-bg">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-kt-text-primary">Earnings Calculator</h1>
        <p className="text-sm text-kt-text-tertiary mt-2 max-w-md mx-auto">
          See how your deposit grows over time with daily compound-like earnings.
        </p>
      </div>
      <EarningsCalculator />
    </div>
  );
}
