'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launchDate, setLaunchDate] = useState<string | null>(null);

  useEffect(() => {
    const dateStr = process.env.NEXT_PUBLIC_LAUNCH_DATE || '';
    setLaunchDate(dateStr || null);

    if (!dateStr) return;

    function tick() {
      const now = Date.now();
      const launch = new Date(dateStr).getTime();
      const diff = Math.max(0, launch - now);

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!launchDate) {
    return (
      <div className="text-center mb-4">
        <p className="text-kt-gold font-semibold">Launch Date Coming Soon</p>
      </div>
    );
  }

  return (
    <div className="text-center mb-4">
      <p className="text-kt-text-tertiary text-sm mb-3">Launch Countdown</p>
      <div className="flex justify-center gap-3">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Minutes' },
          { value: timeLeft.seconds, label: 'Seconds' },
        ].map((item) => (
          <div key={item.label} className="text-center min-w-[60px]">
            <div className="text-2xl md:text-3xl font-extrabold text-kt-gold rounded-lg p-2" style={{
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>
              {String(item.value).padStart(2, '0')}
            </div>
            <p className="text-kt-text-tertiary text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
